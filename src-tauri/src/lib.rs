use std::{
    collections::HashMap,
    io::{Read, Write},
    sync::{Mutex, OnceLock},
    thread,
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

use dashmap::DashMap;
use portable_pty::{native_pty_system, CommandBuilder, PtySize, MasterPty, Child};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};

#[derive(Serialize)]
struct WorkspacePathValidation {
    valid: bool,
    normalized_path: Option<String>,
    message: String,
    can_write: bool,
}

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

// Per-session Mutex inside a DashMap gives lock-free concurrent access to
// *different* sessions. The old Arc<Mutex<HashMap>> forced every
// write_pty/resize_pty call to wait behind any other session's lock.
static PTY_SESSIONS: OnceLock<DashMap<String, Mutex<PtySession>>> = OnceLock::new();

// Shell env is expensive on Unix (forks a login shell to capture PATH and
// friends). Cache it for the process lifetime — users restart after PATH
// changes, and the cache is pre-warmed on first pane open.
static SHELL_ENV_CACHE: OnceLock<HashMap<String, String>> = OnceLock::new();

static SESSION_COUNTER: std::sync::atomic::AtomicU64 =
    std::sync::atomic::AtomicU64::new(0);

fn pty_sessions() -> &'static DashMap<String, Mutex<PtySession>> {
    PTY_SESSIONS.get_or_init(DashMap::new)
}

fn get_shell_env() -> &'static HashMap<String, String> {
    SHELL_ENV_CACHE.get_or_init(|| {
        let mut env = HashMap::new();
        for (k, v) in std::env::vars() {
            env.insert(k, v);
        }
        // Unix: run the user's login shell once to pick up .profile / .zprofile
        // PATH entries that wouldn't be present in a plain process env.
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
    })
}

fn kill_process_tree(child: &mut Box<dyn Child + Send + Sync>) {
    if let Some(pid) = child.process_id() {
        #[cfg(unix)]
        unsafe {
            libc::killpg(pid as libc::pid_t, libc::SIGKILL);
        }
        #[cfg(windows)]
        {
            let mut cmd = std::process::Command::new("taskkill");
            cmd.args(["/F", "/T", "/PID", &pid.to_string()]);
            cmd.creation_flags(CREATE_NO_WINDOW);
            let _ = cmd.output();
        }
    }
    let _ = child.kill();
}

#[tauri::command]
async fn spawn_pty<R: Runtime>(
    app: AppHandle<R>,
    id: String,
    command: Option<String>,
    cwd: Option<String>,
    rows: u16,
    cols: u16,
    shell: Option<String>,
) -> Result<(), String> {
    // Clamp dimensions to minimum 1×1 — ConPTY crashes on 0 cols/rows
    let rows = rows.max(1);
    let cols = cols.max(1);

    let app_handle = app.clone();
    let id_clone = id.clone();

    let result = tokio::task::spawn_blocking(move || {
        let pty_system = native_pty_system();

        let pty_pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to open PTY: {}", e))?;

        // Cached — zero fork cost after first call
        let env = get_shell_env();

        let child = if cfg!(target_os = "windows") {
            let shell_to_use = shell.unwrap_or_else(|| "pwsh.exe".to_string());
            let mut main_cmd = CommandBuilder::new(&shell_to_use);

            if shell_to_use.contains("pwsh.exe") || shell_to_use.contains("powershell.exe") {
                if let Some(ref cmd_str) = command {
                    // Pass the command directly — do NOT wrap inside another
                    // shell invocation. The inner "pwsh.exe -Command <cmd>"
                    // pattern spawns a transient shell that exits after the
                    // command completes, leaving the PTY attached to a dead
                    // process and producing a blank terminal.
                    main_cmd.args([
                        "-NoLogo",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-NoExit",
                        "-Command",
                        cmd_str,
                    ]);
                } else {
                    main_cmd.args(["-NoLogo", "-ExecutionPolicy", "Bypass"]);
                }
            } else if let Some(ref cmd_str) = command {
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
            for (key, val) in env {
                main_cmd.env(key, val);
            }
            main_cmd.env("TERM", "xterm-256color");
            main_cmd.env("COLORTERM", "truecolor");

             match pty_pair.slave.spawn_command(main_cmd) {
                Ok(c) => c,
                Err(_) => {
                    let mut ps_cmd = CommandBuilder::new("powershell.exe");
                    if let Some(ref cmd_str) = command {
                        ps_cmd.args([
                            "-NoLogo",
                            "-ExecutionPolicy",
                            "Bypass",
                            "-NoExit",
                            "-Command",
                            &format!(
                                "powershell.exe -NoLogo -ExecutionPolicy Bypass -Command {}",
                                cmd_str
                            ),
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
                    for (key, val) in env {
                        ps_cmd.env(key, val);
                    }
                    ps_cmd.env("TERM", "xterm-256color");
                    ps_cmd.env("COLORTERM", "truecolor");
                    pty_pair
                        .slave
                        .spawn_command(ps_cmd)
                        .map_err(|e| format!("Failed to spawn preferred shell ({}) and fallback powershell.exe: {}", shell_to_use, e))?
                }
            }
        } else {
            let shell_to_use = shell.unwrap_or_else(|| {
                std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string())
            });
            let mut unix_cmd = CommandBuilder::new(&shell_to_use);

            if shell_to_use.ends_with("sh")
                || shell_to_use.ends_with("bash")
                || shell_to_use.ends_with("zsh")
            {
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
            for (key, val) in env {
                unix_cmd.env(key, val);
            }
            unix_cmd.env("TERM", "xterm-256color");
            unix_cmd.env("COLORTERM", "truecolor");

            pty_pair
                .slave
                .spawn_command(unix_cmd)
                .map_err(|e| format!("Failed to spawn shell {}: {}", shell_to_use, e))?
        };

        let reader = pty_pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("Failed to clone reader: {}", e))?;
        let writer = pty_pair
            .master
            .take_writer()
            .map_err(|e| format!("Failed to take writer: {}", e))?;

        // Explicit error type annotation required: multiple `From<_> for String`
        // impls (tauri_utils, url, uuid) make Rust unable to infer `E` at the
        // `??` call-site (E0282 / E0283). Pinning it to `String` resolves the
        // ambiguity without changing runtime behaviour.
        Ok::<_, String>((pty_pair.master, writer, child, reader))
    })
    .await
    .map_err(|e| e.to_string())??
    ;

    let (master, writer, child, reader) = result;
    let session_id =
        SESSION_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);

    // Kill any pre-existing session for this ID without holding the DashMap
    // shard lock during the (potentially slow) process kill.
    let old_session = pty_sessions().remove(&id).map(|(_, v)| v);
    if let Some(session_mutex) = old_session {
        let _ = tokio::task::spawn_blocking(move || {
            if let Ok(mut s) = session_mutex.into_inner() {
                kill_process_tree(&mut s.child);
            }
        })
        .await;
    }

    pty_sessions().insert(
        id.clone(),
        Mutex::new(PtySession {
            master,
            writer,
            child,
            session_id,
        }),
    );

    let id_clone_thread = id_clone.clone();
    thread::spawn(move || {
        let mut reader = reader;
        let mut buffer = [0u8; 8192];
        let mut accumulated_data = String::with_capacity(16384);
        let mut last_emit = std::time::Instant::now();

        loop {
            match reader.read(&mut buffer) {
                Ok(n) if n > 0 => {
                    accumulated_data
                        .push_str(&String::from_utf8_lossy(&buffer[..n]));

                    if accumulated_data.len() > 12288
                        || last_emit.elapsed().as_millis() > 10
                    {
                        let _ = app_handle.emit(
                            "pty-output",
                            PtyOutputPayload {
                                id: id_clone_thread.clone(),
                                data: accumulated_data.clone(),
                            },
                        );
                        accumulated_data.clear();
                        last_emit = std::time::Instant::now();
                    }
                }
                _ => {
                    if !accumulated_data.is_empty() {
                        let _ = app_handle.emit(
                            "pty-output",
                            PtyOutputPayload {
                                id: id_clone_thread.clone(),
                                data: accumulated_data,
                            },
                        );
                    }
                    break;
                }
            }
        }

        // Only emit pty-exit if this reader belongs to the currently active
        // session (guards against a race where the session was replaced).
        let should_remove = pty_sessions()
            .get(&id_clone_thread)
            .map_or(false, |m| {
                m.lock().map_or(false, |s| s.session_id == session_id)
            });

        if should_remove {
            pty_sessions().remove(&id_clone_thread);
            let _ = app_handle.emit("pty-exit", id_clone_thread);
        }
    });

    Ok(())
}

#[tauri::command]
async fn write_pty(id: String, data: String) -> Result<(), String> {
    if let Some(session_ref) = pty_sessions().get(&id) {
        let mut session = session_ref.lock().unwrap();
        session
            .writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        session.writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Session {} not found", id))
    }
}

#[tauri::command]
async fn resize_pty(id: String, rows: u16, cols: u16) -> Result<(), String> {
    // Dimension validation: ConPTY crashes on 0 cols/rows; Unix produces undefined behavior
    if rows == 0 || cols == 0 {
        return Err(format!(
            "Invalid dimensions: {}x{} — cols and rows must be >= 1",
            cols, rows
        ));
    }
    if let Some(session_ref) = pty_sessions().get(&id) {
        let session = session_ref
            .lock()
            .map_err(|e| format!("Session {} lock poisoned: {}", id, e))?;
        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Resize failed for session {}: {}", id, e))?;
        Ok(())
    } else {
        // Session not found is not necessarily an error — it may have exited
        // between the frontend sending the resize and it arriving here
        Ok(())
    }
}

#[tauri::command]
async fn kill_pty(id: String) -> Result<(), String> {
    if let Some((_, session_mutex)) = pty_sessions().remove(&id) {
        let _ = tokio::task::spawn_blocking(move || {
            if let Ok(mut s) = session_mutex.into_inner() {
                kill_process_tree(&mut s.child);
            }
        })
        .await;
    }
    Ok(())
}

#[tauri::command]
async fn validate_directory(path: String) -> bool {
    tokio::task::spawn_blocking(move || {
        let p = std::path::Path::new(&path);
        p.exists() && p.is_dir()
    })
    .await
    .unwrap_or(false)
}

#[tauri::command]
async fn validate_workspace_path(path: String) -> WorkspacePathValidation {
    tokio::task::spawn_blocking(move || {
        let trimmed = path.trim();
        let Some(home_dir) = home::home_dir() else {
            return WorkspacePathValidation {
                valid: false,
                normalized_path: None,
                message: "Unable to resolve the home directory.".to_string(),
                can_write: false,
            };
        };

        let candidate = if trimmed.is_empty() {
            home_dir
        } else if trimmed == "~" {
            home_dir
        } else if let Some(rest) = trimmed.strip_prefix("~/").or_else(|| trimmed.strip_prefix("~\\")) {
            home_dir.join(rest)
        } else {
            let raw = std::path::PathBuf::from(trimmed);
            if raw.is_absolute() {
                raw
            } else {
                home_dir.join(raw)
            }
        };

        let normalized = candidate.to_string_lossy().to_string();

        if !candidate.exists() {
            return WorkspacePathValidation {
                valid: false,
                normalized_path: Some(normalized),
                message: "Directory does not exist.".to_string(),
                can_write: false,
            };
        }

        if !candidate.is_dir() {
            return WorkspacePathValidation {
                valid: false,
                normalized_path: Some(normalized),
                message: "Path exists, but it is not a directory.".to_string(),
                can_write: false,
            };
        }

        let probe_id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or_default();
        let probe_path = candidate.join(format!(
            ".cortex-write-test-{}-{}",
            std::process::id(),
            probe_id
        ));
        let can_write = std::fs::OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&probe_path)
            .and_then(|mut file| file.write_all(b"ok"))
            .is_ok();

        if can_write {
            let _ = std::fs::remove_file(&probe_path);
            WorkspacePathValidation {
                valid: true,
                normalized_path: Some(normalized),
                message: "Directory exists and is writable.".to_string(),
                can_write: true,
            }
        } else {
            WorkspacePathValidation {
                valid: false,
                normalized_path: Some(normalized),
                message: "Directory exists, but Cortex cannot write to it.".to_string(),
                can_write: false,
            }
        }
    })
    .await
    .unwrap_or_else(|e| WorkspacePathValidation {
        valid: false,
        normalized_path: None,
        message: format!("Path validation failed: {}", e),
        can_write: false,
    })
}

#[tauri::command]
fn get_home_dir() -> Option<String> {
    home::home_dir().map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
async fn check_port(port: u16) -> String {
    use std::time::Duration;
    use tokio::net::TcpStream;
    use tokio::time::timeout;

    let ipv4_addr = format!("127.0.0.1:{}", port);
    let ipv6_addr = format!("[::1]:{}", port);

    let ipv4_res =
        timeout(Duration::from_millis(200), TcpStream::connect(&ipv4_addr)).await;
    if let Ok(Ok(_)) = ipv4_res {
        return "open".to_string();
    }

    let ipv6_res =
        timeout(Duration::from_millis(200), TcpStream::connect(&ipv6_addr)).await;
    if let Ok(Ok(_)) = ipv6_res {
        return "open".to_string();
    }

    let is_timeout = match (ipv4_res, ipv6_res) {
        (Err(_), _) | (_, Err(_)) => true,
        (Ok(Err(ref e)), _) | (_, Ok(Err(ref e)))
            if e.kind() == std::io::ErrorKind::TimedOut =>
        {
            true
        }
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
    matches!(
        port,
        5432 | 3306 | 6379 | 27017 | 5672 | 9200 | 2181 | 25 | 22 | 21 | 3307 | 1433
            | 5433
    )
}

#[tauri::command]
async fn check_port_lsof(port: u16) -> String {
    use tokio::process::Command;

    if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        cmd.args([
            "/C",
            &format!("netstat -ano | findstr :{} | findstr LISTEN", port),
        ]);
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        if let Ok(output) = cmd.output().await {
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
        let mut find_cmd = Command::new("cmd");
        find_cmd.args([
            "/C",
            &format!("netstat -ano | findstr :{} | findstr LISTEN", port),
        ]);
        #[cfg(windows)]
        find_cmd.creation_flags(CREATE_NO_WINDOW);

        let output = find_cmd.output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Some(line) = stdout.lines().next() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if let Some(pid) = parts.last() {
                let mut kill_cmd = Command::new("taskkill");
                kill_cmd.args(["/F", "/T", "/PID", pid]);
                #[cfg(windows)]
                kill_cmd.creation_flags(CREATE_NO_WINDOW);
                let _ = kill_cmd.output().await;
            }
        }
    } else {
        let _ = Command::new("sh")
            .args([
                "-c",
                &format!("lsof -t -iTCP:{} -sTCP:LISTEN | xargs kill -9", port),
            ])
            .output()
            .await;
    }
    Ok(())
}

/// Returns the Tauri PATH in development; no-op in release builds.
/// The shell env is now cached, so this is essentially free after first use.
#[tauri::command]
async fn debug_env() -> String {
    #[cfg(debug_assertions)]
    {
        let env = tokio::task::spawn_blocking(|| get_shell_env())
            .await
            .unwrap_or_else(|_| get_shell_env());
        return env
            .get("PATH")
            .or_else(|| env.get("Path"))
            .or_else(|| env.get("path"))
            .cloned()
            .unwrap_or_else(|| {
                let keys: Vec<&String> = env.keys().collect();
                format!("PATH not found. Available keys: {:?}", keys)
            });
    }
    #[cfg(not(debug_assertions))]
    String::new()
}

#[tauri::command]
async fn check_command(command: String) -> bool {
    tokio::task::spawn_blocking(move || {
        let mut cmd = if cfg!(target_os = "windows") {
            let mut c = std::process::Command::new("where");
            c.arg(&command);
            #[cfg(windows)]
            c.creation_flags(CREATE_NO_WINDOW);
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
    })
    .await
    .unwrap_or(false)
}

#[tauri::command]
async fn check_node_version() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        let mut cmd = std::process::Command::new("node");
        cmd.arg("--version");
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let output = cmd
            .output()
            .map_err(|e| format!("Node.js is unavailable: {}", e))?;
        if !output.status.success() {
            return Err("Node.js version check failed.".to_string());
        }

        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if version.is_empty() {
            Err("Node.js did not report a version.".to_string())
        } else {
            Ok(version)
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn check_git_version() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        let mut cmd = std::process::Command::new("git");
        cmd.arg("--version");
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let output = cmd
            .output()
            .map_err(|e| format!("Git is unavailable: {}", e))?;
        if !output.status.success() {
            return Err("Git version check failed.".to_string());
        }

        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if version.is_empty() {
            Err("Git did not report a version.".to_string())
        } else {
            Ok(version)
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

fn run_install_command(program: &str, args: &[&str]) -> Result<(), String> {
    let mut cmd = std::process::Command::new(program);
    cmd.args(args);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to start {}: {}", program, e))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let detail = if !stderr.is_empty() { stderr } else { stdout };

    Err(if detail.is_empty() {
        format!("{} exited with status {:?}", program, output.status.code())
    } else {
        detail
    })
}

#[tauri::command]
async fn install_dev_tool(tool: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let normalized = tool.trim().to_ascii_lowercase();
        if normalized != "node" && normalized != "git" {
            return Err(format!("Unsupported tool: {}", tool));
        }

        #[cfg(windows)]
        {
            let package_id = match normalized.as_str() {
                "node" => "OpenJS.NodeJS.LTS",
                "git" => "Git.Git",
                _ => unreachable!(),
            };

            return run_install_command(
                "winget",
                &[
                    "install",
                    "--id",
                    package_id,
                    "--exact",
                    "--silent",
                    "--accept-package-agreements",
                    "--accept-source-agreements",
                ],
            )
            .map_err(|e| {
                format!(
                    "Install failed through winget. Install winget/App Installer or run the installer manually. {}",
                    e
                )
            });
        }

        #[cfg(target_os = "macos")]
        {
            let package = match normalized.as_str() {
                "node" => "node",
                "git" => "git",
                _ => unreachable!(),
            };
            return run_install_command("brew", &["install", package]).map_err(|e| {
                format!(
                    "Install failed through Homebrew. Install Homebrew or install {} manually. {}",
                    package, e
                )
            });
        }

        #[cfg(all(unix, not(target_os = "macos")))]
        {
            let package = match normalized.as_str() {
                "node" => "nodejs",
                "git" => "git",
                _ => unreachable!(),
            };

            if run_install_command("sh", &["-c", "command -v apt-get"]).is_ok() {
                return run_install_command("sudo", &["apt-get", "install", "-y", package]);
            }
            if run_install_command("sh", &["-c", "command -v dnf"]).is_ok() {
                return run_install_command("sudo", &["dnf", "install", "-y", package]);
            }
            if run_install_command("sh", &["-c", "command -v pacman"]).is_ok() {
                return run_install_command("sudo", &["pacman", "-S", "--noconfirm", package]);
            }

            Err(format!(
                "No supported package manager found for automatic {} installation.",
                normalized
            ))
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn get_agents_dir<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
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
        let ps_args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &command];

        let mut pwsh_cmd = Command::new("pwsh.exe");
        pwsh_cmd.args(&ps_args);
        #[cfg(windows)]
        pwsh_cmd.creation_flags(CREATE_NO_WINDOW);

        let output = match pwsh_cmd.output().await {
            Ok(o) => o,
            Err(_) => {
                let mut ps5_cmd = Command::new("powershell.exe");
                ps5_cmd.args(&ps_args);
                #[cfg(windows)]
                ps5_cmd.creation_flags(CREATE_NO_WINDOW);
                ps5_cmd
                    .output()
                    .await
                    .map_err(|e| format!("Failed to execute powershell: {}", e))?
            }
        };

        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let msg = if !stderr.is_empty() { stderr } else { stdout };
            Err(if msg.is_empty() {
                format!("Installation exited with code {:?}", output.status.code())
            } else {
                msg
            })
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
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let msg = if !stderr.is_empty() { stderr } else { stdout };
            Err(if msg.is_empty() {
                format!("Installation exited with code {:?}", output.status.code())
            } else {
                msg
            })
        }
    }
}

#[tauri::command]
async fn get_default_shell() -> String {
    tokio::task::spawn_blocking(move || {
        if cfg!(target_os = "windows") {
            let mut where_cmd = std::process::Command::new("where");
            where_cmd.arg("pwsh.exe");
            #[cfg(windows)]
            where_cmd.creation_flags(CREATE_NO_WINDOW);
            let pwsh_exists = where_cmd
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);
            if pwsh_exists {
                "pwsh.exe".to_string()
            } else {
                "powershell.exe".to_string()
            }
        } else {
            std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string())
        }
    })
    .await
    .unwrap_or_else(|_| "/bin/sh".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            spawn_pty,
            write_pty,
            resize_pty,
            kill_pty,
            validate_directory,
            validate_workspace_path,
            get_home_dir,
            get_default_shell,
            check_node_version,
            check_git_version,
            install_dev_tool,
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
