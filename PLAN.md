# Plan: Dynamic & Managed AI Agents

Manage AI agents dynamically within Cortex Space, allowing users to add custom agents and providing a fully managed onboarding experience for default agents.

## Summary
Transition from hardcoded AI agent presets to a dynamic, store-persistent system. Introduce a managed setup during onboarding that automatically downloads and configures default agents (Gemini, Claude, Antigravity, etc.) into a dedicated application directory.

## Context
- **Current state**: Agents are hardcoded in `src/lib/setup-constants.ts` and UI components.
- **Goal**: Dynamic management, user-defined agents, and "Fully Managed" automatic setup.
- **Constraints**: Use Tauri's Store for persistence and Tauri's backend for managed downloads/installations.

## System Impact
- **Source of Truth**: The list of agents moves from a static constant to the Tauri Store (`settings.json`).
- **Data Flow**: Onboarding -> Store -> Setup UI -> Terminal Execution.
- **Lifecycle**: Agents are detected/installed during onboarding or via Settings. The app ensures binaries are available before launch.
- **Persistence**: All agent configurations, including custom ones, are saved in the user's settings.

## Approach
1. **Dynamic Store**: Implement `useAgents` hook to manage the agent list in the Tauri store.
2. **Managed Backend**: Add Tauri commands to download, extract, and verify agent binaries.
3. **Onboarding Integration**: Insert a new "Agent Setup" step in the onboarding flow to handle the "Fully Managed" installation.
4. **UI Updates**: Replace static `AGENT_PRESETS` usage with dynamic data from `useAgents`.

## Changes

### 1. Types & Constants
- `src/lib/setup-constants.ts`: Define `Agent` interface and `DEFAULT_AGENTS_METADATA` (including download URLs).
- `src/types.ts`: Add `Agent` type.

### 2. Backend (Tauri)
- `src-tauri/src/lib.rs`: 
    - `download_agent`: Command to fetch and save agent binaries.
    - `check_command_path`: Command to verify if an agent's binary exists.
    - `get_agents_dir`: Helper to get the managed agents directory.

### 3. Hooks
- `src/hooks/useAgents.ts`: New hook to manage agents (CRUD + install logic).

### 4. Onboarding UI
- `src/features/setup/components/steps/StepAgents.tsx`: New onboarding step for agent discovery and managed installation.
- `src/features/setup/SetupView.tsx`: Integrate `StepAgents` and update step numbering.

### 5. Existing UI Refactor
- `src/features/setup/components/steps/StepConfigure.tsx`: Use dynamic agents for the "Agents" mode.
- `src/features/setup/components/ui-parts/PaneConfigCard.tsx`: Use dynamic agents for selection.
- `src/components/dialogs/SettingsDialog.tsx`: Add "Agents" management tab.

### 6. Utils
- `src/lib/setup-utils.ts`: Update `derivePaneName` to resolve names against the dynamic agent list.

## Verification
- **End-to-End**: Run onboarding, verify default agents download/install, add a custom agent (e.g., `antigravity` / `agy`), and launch a workspace with it.
- **Edge Cases**:
    - Network failure during download.
    - Binary execution permissions.
    - Custom agent command not found in PATH.
    - Deleting an agent currently used in a preset.

