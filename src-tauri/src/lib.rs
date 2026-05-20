use std::{
    collections::HashMap,
    io::{Read, Write},
    sync::{Arc, Mutex},
    thread,
};
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Runtime};
use once_cell::sync::Lazy;

#[derive(Serialize, Clone)]
struct PtyOutputPayload {
    id: String,
    data: String,
}

struct PtySession {
    writer: Box<dyn Write + Send>,
}

type PtyState = Arc<Mutex<HashMap<String, PtySession>>>;

static PTY_SESSIONS: Lazy<PtyState> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

#[tauri::command]
fn spawn_pty<R: Runtime>(
    app: AppHandle<R>,
    id: String,
    command: Option<String>,
    cwd: Option<String>,
) -> Result<(), String> {
    let pty_system = native_pty_system();
    
    // Default size
    let pty_pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell = if cfg!(target_os = "windows") {
        "powershell.exe"
    } else {
        "bash"
    };

    let mut cmd = CommandBuilder::new(command.unwrap_or_else(|| shell.to_string()));
    if let Some(path) = cwd {
        cmd.cwd(path);
    }

    let mut child = pty_pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    
    // Move child to a separate thread to wait for it without blocking
    thread::spawn(move || {
        let _ = child.wait();
    });

    let reader = pty_pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pty_pair.master.take_writer().map_err(|e| e.to_string())?;

    // Store the writer in our global state
    let mut sessions = PTY_SESSIONS.lock().unwrap();
    sessions.insert(id.clone(), PtySession { writer });

    // Spawn a reader thread to stream output to the frontend
    let app_clone = app.clone();
    let id_clone = id.clone();
    thread::spawn(move || {
        let mut reader = reader;
        let mut buffer = [0u8; 1024];
        loop {
            match reader.read(&mut buffer) {
                Ok(n) if n > 0 => {
                    let data = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = app_clone.emit("pty-output", PtyOutputPayload {
                        id: id_clone.clone(),
                        data,
                    });
                }
                Ok(_) => break, // EOF
                Err(_) => break,
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
    }
    Ok(())
}

#[tauri::command]
fn resize_pty(_id: String, _rows: u16, _cols: u16) -> Result<(), String> {
    // Note: portable-pty resize requires access to the master side.
    // In a more robust implementation, we'd store the master side in the session as well.
    // For MVP, we will focus on spawn/write/read.
    Ok(())
}

#[tauri::command]
fn kill_pty(id: String) -> Result<(), String> {
    let mut sessions = PTY_SESSIONS.lock().unwrap();
    sessions.remove(&id);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            spawn_pty,
            write_pty,
            resize_pty,
            kill_pty
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
