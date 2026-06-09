export const ONBOARDING_CONTENT = {
  AWAKENING: "AWAKENING SYSTEM",
  TITLE: "AI Agent Protocols",
  SUBTITLE: "Scan and configure your AI agentic coding CLI tools.",
  DETECTED: "Detected",
  INSTALLING: "Installing",
  INSTALL: "Install",
  FAILED: "Failed",
  RETRY: "Retry",
  ACTIVE_PROTOCOLS: (count: number) => `✓ ${count} active protocol${count > 1 ? 's' : ''} ready`,
  NO_PROTOCOLS: "⚠ No active AI protocols configured",
  CONTINUE: "Continue to Workspace",
  CONFIGURING: "Configuring Matrix & Launching..."
};

export const PANE_SEMANTICS = {
  NEW_PANE: "New Pane",
  DOCKER: "Docker",
  DOCKER_UP: "Docker Up",
  DOCKER_BUILD: "Docker Build",
  GIT: "Git",
  GIT_STATUS: "Git Status",
  GIT_LOG: "Git Log",
  PYTHON: "Python",
  NODE: "Node",
  AGENT_SUFFIX: "Agent"
};

export const APP_CONTENT = {
  WORKSPACE_DEFAULT_NAME: "Workspace",
  WORKSPACE_ACTIVATED: (name: string) => `${name} activated successfully`,
  WORKSPACE_RESET: "Workspace reset successfully",
  WORKSPACE_RESET_DESC: "The workspace has reverted to an empty state.",
  WORKSPACE_CLOSED: "Workspace closed successfully",
  WORKSPACE_CLOSED_DESC: "Process connections have been terminated.",
  LAYOUT_UPDATED: "Layout updated successfully",
  LAYOUT_UPDATED_DESC: "The pane position has been saved.",
  TEMPLATE_LAUNCHED: (name: string) => `${name} launched successfully`,
  TEMPLATE_LAUNCHED_DESC: "The template was loaded from the library."
};
