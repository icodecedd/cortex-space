use std::{
    collections::HashMap,
    io::{Read, Write},
    sync::{Arc, Mutex},
    thread,
};
use portable_pty::{native_pty_system, CommandBuilder, PtySize, MasterPty, Child};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Runtime};
use once_cell::sync::Lazy;

#[derive(Serialize, Clone)]
struct PtyOutputPayload {
    id: String,
    data: Vec<u8>,
}

struct PtySession {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
}

type PtyState = Arc<Mutex<HashMap<String, PtySession>>>;

static PTY_SESSIONS: Lazy<PtyState> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

fn get_shell_env() -> HashMap<String, String> {
    let mut env = HashMap::new();
    
    // First, inherit all current process environment variables
    for (k, v) in std::env::vars() {
        env.insert(k, v);
    }

    // For Unix, load the login shell's profiles to load PATH and env correctly
    #[cfg(unix)]
    {
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
        if let Ok(output) = std::process::Command::new(&shell)
            .args(["-l", "-c", "env"])
            .output()
        {
            for line in String::from_utf8_lossy(&output.stdout).lines() {
                let mut parts = line.splitn(2, '=');
                if let (Some(k), Some(v)) = (parts.next(), parts.next()) {
                    env.insert(k.to_string(), v.to_string());
                }
            }
        }
    }
    
    env
}

#[tauri::command]
fn spawn_pty<R: Runtime>(
    app: AppHandle<R>,
    id: String,
    command: Option<String>,
    cwd: Option<String>,
    rows: u16,
    cols: u16,
) -> Result<(), String> {
    let pty_system = native_pty_system();
    
    let pty_pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    let env = get_shell_env();

    let child = if cfg!(target_os = "windows") {
        // Try spawning pwsh.exe first, fallback to powershell.exe
        let mut pwsh_cmd = CommandBuilder::new("pwsh.exe");
        if let Some(ref cmd_str) = command {
            pwsh_cmd.args([
                "-NoLogo",
                "-ExecutionPolicy",
                "Bypass",
                "-NoExit",
                "-Command",
                &format!("pwsh.exe -NoLogo -ExecutionPolicy Bypass -Command {}", cmd_str),
            ]);
        } else {
            pwsh_cmd.args(["-NoLogo", "-ExecutionPolicy", "Bypass"]);
        }
        if let Some(ref path) = cwd {
            if !path.trim().is_empty() && std::path::Path::new(path).exists() {
                pwsh_cmd.cwd(path);
            } else if let Some(home_dir) = home::home_dir() {
                pwsh_cmd.cwd(home_dir);
            }
        } else if let Some(home_dir) = home::home_dir() {
            pwsh_cmd.cwd(home_dir);
        }
        for (key, val) in &env {
            pwsh_cmd.env(key, val);
        }
        pwsh_cmd.env("TERM", "xterm-256color");
        pwsh_cmd.env("COLORTERM", "truecolor");

        match pty_pair.slave.spawn_command(pwsh_cmd) {
            Ok(c) => c,
            Err(_) => {
                // Fallback to powershell.exe
                let mut ps_cmd = CommandBuilder::new("powershell.exe");
                if let Some(ref cmd_str) = command {
                    ps_cmd.args([
                        "-NoLogo",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-NoExit",
                        "-Command",
                        &format!("powershell.exe -NoLogo -ExecutionPolicy Bypass -Command {}", cmd_str),
                    ]);
                } else {
                    ps_cmd.args(["-NoLogo", "-ExecutionPolicy", "Bypass"]);
                }
                if let Some(ref path) = cwd {
                    if !path.trim().is_empty() && std::path::Path::new(path).exists() {
                        ps_cmd.cwd(path);
                    } else if let Some(home_dir) = home::home_dir() {
                        ps_cmd.cwd(home_dir);
                    }
                } else if let Some(home_dir) = home::home_dir() {
                    ps_cmd.cwd(home_dir);
                }
                for (key, val) in &env {
                    ps_cmd.env(key, val);
                }
                ps_cmd.env("TERM", "xterm-256color");
                ps_cmd.env("COLORTERM", "truecolor");

                pty_pair.slave.spawn_command(ps_cmd).map_err(|e| format!("Failed to spawn powershell: {}", e))?
            }
        }
    } else {
        // Unix shell
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
        let mut unix_cmd = CommandBuilder::new(&shell);
        unix_cmd.arg("-l");
        unix_cmd.arg("-i");
        unix_cmd.arg("-c");
        if let Some(ref cmd_str) = command {
            unix_cmd.arg(format!("exec {}", cmd_str));
        } else {
            unix_cmd.arg("exec $SHELL");
        }
        if let Some(ref path) = cwd {
            if !path.trim().is_empty() && std::path::Path::new(path).exists() {
                unix_cmd.cwd(path);
            } else if let Some(home_dir) = home::home_dir() {
                unix_cmd.cwd(home_dir);
            }
        } else if let Some(home_dir) = home::home_dir() {
            unix_cmd.cwd(home_dir);
        }
        for (key, val) in &env {
            unix_cmd.env(key, val);
        }
        unix_cmd.env("TERM", "xterm-256color");
        unix_cmd.env("COLORTERM", "truecolor");

        pty_pair.slave.spawn_command(unix_cmd).map_err(|e| format!("Failed to spawn command: {}", e))?
    };
    let reader = pty_pair.master.try_clone_reader().map_err(|e| format!("Failed to clone reader: {}", e))?;
    let writer = pty_pair.master.take_writer().map_err(|e| format!("Failed to take writer: {}", e))?;

    let mut sessions = PTY_SESSIONS.lock().unwrap();
    // Kill existing session if any with the same ID
    if let Some(mut old_session) = sessions.remove(&id) {
        let _ = old_session.child.kill();
    }

    sessions.insert(
        id.clone(),
        PtySession {
            master: pty_pair.master,
            writer,
            child,
        },
    );



    let app_clone = app.clone();
    let id_clone = id.clone();
    thread::spawn(move || {
        let mut reader = reader;
        let mut buffer = [0u8; 8192]; // Larger buffer for better throughput
        loop {
            match reader.read(&mut buffer) {
                Ok(n) if n > 0 => {
                    let data = buffer[..n].to_vec();
                    let _ = app_clone.emit("pty-output", PtyOutputPayload {
                        id: id_clone.clone(),
                        data,
                    });
                }
                _ => break, // EOF or error
            }
        }
        // Notify frontend that this PTY session has terminated
        let _ = app_clone.emit("pty-exit", id_clone.clone());
    });

    Ok(())
}

#[tauri::command]
fn write_pty(id: String, data: String) -> Result<(), String> {
    let mut sessions = PTY_SESSIONS.lock().unwrap();
    if let Some(session) = sessions.get_mut(&id) {
        session.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        session.writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Session {} not found", id))
    }
}

#[tauri::command]
fn resize_pty(id: String, rows: u16, cols: u16) -> Result<(), String> {
    let mut sessions = PTY_SESSIONS.lock().unwrap();
    if let Some(session) = sessions.get_mut(&id) {
        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Session {} not found", id))
    }
}

#[tauri::command]
fn kill_pty(id: String) -> Result<(), String> {
    let mut sessions = PTY_SESSIONS.lock().unwrap();
    if let Some(mut session) = sessions.remove(&id) {
        let _ = session.child.kill();
    }
    Ok(())
}

#[tauri::command]
fn validate_directory(path: String) -> bool {
    let p = std::path::Path::new(&path);
    p.exists() && p.is_dir()
}

#[tauri::command]
fn get_home_dir() -> Option<String> {
    home::home_dir().map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn debug_env() -> String {
    let env = get_shell_env();
    env.get("PATH")
        .or_else(|| env.get("Path"))
        .or_else(|| env.get("path"))
        .cloned()
        .unwrap_or_else(|| {
            let keys: Vec<&String> = env.keys().collect();
            format!("PATH not found. Available keys: {:?}", keys)
        })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            spawn_pty,
            write_pty,
            resize_pty,
            kill_pty,
            validate_directory,
            get_home_dir,
            debug_env
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
