# ADR-001: Scan & Choose Agent Architecture

## Status
Approved

## Context
Originally, the application's onboarding flow tried to automatically install and synchronize all default AI agents (Gemini, Claude, Antigravity) over the network on launch. This approach introduced multiple critical issues:
1. **Brittleness**: Network failures, command line permission restrictions (e.g., PowerShell Execution Policies on Windows), and missing dependency runtimes (like Node.js or Python) frequently caused the setup wizard to hang or fail.
2. **Disk Bloat & Storage Concerns**: Bundling all default agents as embedded binaries (Tauri Sidecars) would bloat the application installer size by ~70MB - 100MB, carrying tools the user might never use.
3. **Lack of User Agency**: Users who only wanted to use a specific CLI (like Gemini) had no way to prevent other default agentic tools from being installed.

---

## Decisions Made

### 1. "Scan & Choose" Onboarding Model
Instead of bundling binaries or auto-running installers, the first-launch onboarding screen operates in a non-blocking mode:
- It runs background checks (`check_command`) on startup to see if default agents are already present in the user's system `PATH`.
- If an agent is found, it is marked as **Active/Detected** automatically.
- If missing, it remains **Not Installed**, exposing an optional **Install** button.
- The **"Continue to Workspace"** button is always enabled, permitting the user to proceed with whatever agents they want (or none at all).

### 2. On-Demand Background Installation
If a user wants to activate a default or custom agent from the UI:
- They click the **Install** button, which runs the installation command in a background shell process (using our Rust `install_agent_cli` command).
- This keeps the core app installer size minimal (~15MB) and only downloads what is requested.

### 3. Unified Custom Agent Registration
When registering custom protocols (e.g., a new CLI like `droid`):
- Users input the Label, Command, and optional **Installation Command** and **Download URL**.
- If an install script is provided, they can trigger it from settings. If not, the tool is expected to be installed manually and is verified immediately against the system `PATH`.

---

## Consequences

### Positive (Pros)
* **Ultra-Lightweight Installer**: The initial application download stays small (~15MB) and fast.
* **Complete User Agency**: The user retains absolute control over what is installed on their machine.
* **Zero-Friction Detection**: If they already have their preferred tool installed (e.g. Gemini CLI), the app detects it instantly with no setup downtime.

### Trade-offs & Negatives (Cons)
* **Runtime Dependency**: Running install commands from the UI requires the user to have necessary CLI runtimes pre-configured (e.g., Node.js for npm packages).
* **First-Launch Installation Delay**: If missing, agents must be fetched over the network, introducing a brief installation waiting period.

---

## Alternatives Considered & Deferred

### Alternative A: Tauri Sidecars (Embedded Binaries)
* **Deferred to Roadmap**: While sidecars ensure 100% offline reliability, they bloat the installer and install unwanted files on the user's machine. We chose the scan-and-choose model as the primary setup for better storage efficiency and user choice.

### Alternative B: Force Auto-Install Everything
* **Rejected**: Highly fragile due to corporate firewall policies, script execution blocks, and runtime dependencies.
