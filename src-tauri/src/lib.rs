use std::{
    collections::HashMap,
    io::{Read, Write},
    sync::{Arc, Mutex},
    thread,
};
use portable_pty::{native_pty_system, CommandBuilder, PtySize, MasterPty, Child};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};
use once_cell::sync::Lazy;

#[derive(Serialize, Clone)]
struct PtyOutputPayload {
    id: String,
    data: String,
}

struct PtySession {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
    session_id: u64,
}

type PtyState = Arc<Mutex<HashMap<String, PtySession>>>;

static PTY_SESSIONS: Lazy<PtyState> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));
static SESSION_COUNTER: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

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

fn kill_process_tree(child: &mut Box<dyn Child + Send + Sync>) {
    if let Some(pid) = child.process_id() {
        #[cfg(unix)]
        unsafe {
            // portable-pty creates a new session leader, so PID is the PGID
            libc::killpg(pid as libc::pid_t, libc::SIGKILL);
        }
        #[cfg(windows)]
        {
            let _ = std::process::Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .output();
        }
    }
    // Fallback if the process is still around
    let _ = child.kill();
}

#[tauri::command]
fn spawn_pty<R: Runtime>(
    app: AppHandle<R>,
    id: String,
    command: Option<String>,
    cwd: Option<String>,
    rows: u16,
    cols: u16,
    shell: Option<String>,
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
        let shell_to_use = shell.unwrap_or_else(|| "pwsh.exe".to_string());
        let mut main_cmd = CommandBuilder::new(&shell_to_use);
        
        if shell_to_use.contains("pwsh.exe") || shell_to_use.contains("powershell.exe") {
            if let Some(ref cmd_str) = command {
                main_cmd.args([
                    "-NoLogo",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-NoExit",
                    "-Command",
                    &format!("{} -NoLogo -ExecutionPolicy Bypass -Command {}", shell_to_use, cmd_str),
                ]);
            } else {
                main_cmd.args(["-NoLogo", "-ExecutionPolicy", "Bypass"]);
            }
        } else if let Some(ref cmd_str) = command {
            // For other shells like git bash or cmd
            main_cmd.arg("-c");
            main_cmd.arg(cmd_str);
        }

        if let Some(ref path) = cwd {
            if !path.trim().is_empty() && std::path::Path::new(path).exists() {
                main_cmd.cwd(path);
            } else if let Some(home_dir) = home::home_dir() {
                main_cmd.cwd(home_dir);
            }
        } else if let Some(home_dir) = home::home_dir() {
            main_cmd.cwd(home_dir);
        }
        for (key, val) in &env {
            main_cmd.env(key, val);
        }
        main_cmd.env("TERM", "xterm-256color");
        main_cmd.env("COLORTERM", "truecolor");

        match pty_pair.slave.spawn_command(main_cmd) {
            Ok(c) => c,
            Err(_) if shell_to_use == "pwsh.exe" => {
                // Fallback to powershell.exe if pwsh failed and was the default
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
            Err(e) => return Err(format!("Failed to spawn {}: {}", shell_to_use, e)),
        }
    } else {
        // Unix shell
        let shell_to_use = shell.unwrap_or_else(|| std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string()));
        let mut unix_cmd = CommandBuilder::new(&shell_to_use);
        
        // Add interactive/login flags for standard shells
        if shell_to_use.ends_with("sh") || shell_to_use.ends_with("bash") || shell_to_use.ends_with("zsh") {
            unix_cmd.arg("-l");
            unix_cmd.arg("-i");
        }
        
        if let Some(ref cmd_str) = command {
            unix_cmd.arg("-c");
            unix_cmd.arg(format!("exec {}", cmd_str));
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

        pty_pair.slave.spawn_command(unix_cmd).map_err(|e| format!("Failed to spawn shell {}: {}", shell_to_use, e))?
    };
    let reader = pty_pair.master.try_clone_reader().map_err(|e| format!("Failed to clone reader: {}", e))?;
    let writer = pty_pair.master.take_writer().map_err(|e| format!("Failed to take writer: {}", e))?;

    let session_id = SESSION_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);

    let mut sessions = PTY_SESSIONS.lock().unwrap();
    // Kill existing session if any with the same ID
    if let Some(mut old_session) = sessions.remove(&id) {
        kill_process_tree(&mut old_session.child);
    }

    sessions.insert(
        id.clone(),
        PtySession {
            master: pty_pair.master,
            writer,
            child,
            session_id,
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
                    let data = String::from_utf8_lossy(&buffer[..n]).into_owned();
                    let _ = app_clone.emit("pty-output", PtyOutputPayload {
                        id: id_clone.clone(),
                        data,
                    });
                }
                _ => break, // EOF or error
            }
        }
        // Notify frontend that this PTY session has terminated, ONLY if it is still the current active session
        let mut sessions = PTY_SESSIONS.lock().unwrap();
        if let Some(session) = sessions.get(&id_clone) {
            if session.session_id == session_id {
                sessions.remove(&id_clone);
                drop(sessions); // Release lock before emitting event to avoid deadlocks
                let _ = app_clone.emit("pty-exit", id_clone.clone());
            }
        }
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
        kill_process_tree(&mut session.child);
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
async fn check_port(port: u16) -> String {
    use tokio::net::TcpStream;
    use std::time::Duration;
    use tokio::time::timeout;

    let ipv4_addr = format!("127.0.0.1:{}", port);
    let ipv6_addr = format!("[::1]:{}", port);

    // Try IPv4 loopback async with a short timeout (200ms)
    let ipv4_res = timeout(Duration::from_millis(200), TcpStream::connect(&ipv4_addr)).await;
    if let Ok(Ok(_)) = ipv4_res {
        return "open".to_string();
    }

    // Try IPv6 loopback async with a short timeout (200ms)
    let ipv6_res = timeout(Duration::from_millis(200), TcpStream::connect(&ipv6_addr)).await;
    if let Ok(Ok(_)) = ipv6_res {
        return "open".to_string();
    }

    // Determine if it was a timeout or connection refusal
    let is_timeout = match (ipv4_res, ipv6_res) {
        (Err(_), _) | (_, Err(_)) => true, // timeout error
        (Ok(Err(ref e)), _) | (_, Ok(Err(ref e))) if e.kind() == std::io::ErrorKind::TimedOut => true,
        _ => false,
    };

    if is_timeout {
        "timeout".to_string()
    } else {
        "refused".to_string()
    }
}

#[tauri::command]
fn is_port_blocked(port: u16) -> bool {
    // Blocklist: well-known non-browser ports (DBs, SSH, SMTP, etc.)
    matches!(port, 5432 | 3306 | 6379 | 27017 | 5672 | 9200 | 2181 | 25 | 22 | 21 | 3307 | 1433 | 5433)
}

#[tauri::command]
async fn check_port_lsof(port: u16) -> String {
    use tokio::process::Command;
    
    if cfg!(target_os = "windows") {
        let output = Command::new("cmd")
            .args(["/C", &format!("netstat -ano | findstr :{} | findstr LISTEN", port)])
            .output()
            .await;
            
        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if !stdout.trim().is_empty() {
                return "open".to_string();
            }
        }
    } else {
        let output = Command::new("sh")
            .args(["-c", &format!("lsof -iTCP:{} -sTCP:LISTEN", port)])
            .output()
            .await;
            
        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if stdout.contains("LISTEN") {
                return "open".to_string();
            }
        }
    }
    
    "closed".to_string()
}

#[tauri::command]
async fn kill_port_process(port: u16) -> Result<(), String> {
    use tokio::process::Command;

    if cfg!(target_os = "windows") {
        // Find PID holding the port
        let output = Command::new("cmd")
            .args(["/C", &format!("netstat -ano | findstr :{} | findstr LISTEN", port)])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Some(line) = stdout.lines().next() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if let Some(pid) = parts.last() {
                let _ = Command::new("taskkill")
                    .args(["/F", "/T", "/PID", pid])
                    .output()
                    .await;
            }
        }
    } else {
        // Unix: lsof -t -iTCP:<port> -sTCP:LISTEN | xargs kill -9
        let _ = Command::new("sh")
            .args(["-c", &format!("lsof -t -iTCP:{} -sTCP:LISTEN | xargs kill -9", port)])
            .output()
            .await;
    }
    Ok(())
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

#[tauri::command]
fn check_command(command: String) -> bool {
    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = std::process::Command::new("where");
        c.arg(&command);
        c
    } else {
        let mut c = std::process::Command::new("which");
        c.arg(&command);
        c
    };
    
    match cmd.output() {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

#[tauri::command]
fn get_agents_dir<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
    let path = app.path().app_data_dir()
        .map_err(|e| e.to_string())?
        .join("agents");
    
    if !path.exists() {
        std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
async fn install_agent_cli(command: String) -> Result<(), String> {
    use tokio::process::Command;

    if cfg!(target_os = "windows") {
        let output = Command::new("powershell")
            .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &command])
            .output()
            .await
            .map_err(|e| format!("Failed to execute powershell: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    } else {
        let output = Command::new("sh")
            .args(["-c", &command])
            .output()
            .await
            .map_err(|e| format!("Failed to execute shell: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
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
            check_port,
            is_port_blocked,
            check_port_lsof,
            kill_port_process,
            debug_env,
            check_command,
            get_agents_dir,
            install_agent_cli
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
