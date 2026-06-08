# ADR-006: Workspace Templates, Snippets & Port Detection

## Status
Approved

## Context
Developers frequently execute repetitive startup tasks (like running databases, frontends, and API services side-by-side) and re-running utility commands. To optimize these patterns, the system requires features that save layout states, support reusable script configurations with variable prompts, and automatically detect running local servers.

---

## Decisions Made

### 1. Serialized Layout Trees (Templates)
We modeled workspace structures as recursive node trees (storing split directions, ratios, commands, and folders):
- Users can capture any running workspace configuration as a "Space Template".
- This saves the exact grid topology and default command strings, allowing developers to restore a multi-pane environment instantly with one click from the library.

### 2. Snappy Variable Prompting (`{{VAR}}`)
Command snippets support dynamic placeholders (e.g., `git checkout {{BRANCH_NAME}}`):
- When a snippet is triggered, a glassmorphic modal prompts the user to input values for the detected variables.
- Once filled, the command resolves and injects directly into the active terminal's input pipe.

### 3. Asynchronous Port Listening & TCP Verification
To streamline accessing running dev services:
- A regex filter monitors output streams from the terminal session manager for local network addresses (e.g. `localhost:5173`, `127.0.0.1:8080`).
- When a port signature matches, the app runs a TCP connection handshake check on the Rust backend to confirm the port is actively listening.
- Once verified, a clickable link badge is injected directly into the pane header, enabling instant browser opening.

---

## Consequences

### Positive (Pros)
* **High Efficiency**: Eliminates copying-and-pasting URLs or manually checking terminal logs to find server ports.
* **Command Adaptability**: Dynamic placeholders make snippets highly reusable.
* **Unified Snippet Panel**: Reusable settings modal handles bulk snippet additions and deletions cleanly.

### Trade-offs & Negatives (Cons)
* **Active Port Polling Overhead**: Running TCP checks on every matched port address requires optimal background throttling to prevent excess CPU usage. We limit check calls to single debounced invocations.
