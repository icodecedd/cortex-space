export const ASSETS = {
  LOGO: "/cortex-logo.png",
  LOGO_FALLBACK: "/tauri.svg"
};

export const SPLASH_CONTENT = {
  TITLE: "CORTEX",
  SUBTITLE: "SPACE",
  AWAKENING: "INITIALIZING SYSTEM"
};

export const MODE_SELECTOR_CONTENT = {
  TITLE: "CORTEX",
  SUBTITLE: "SPACE",
  DESCRIPTION: "The unified workspace for your terminal and AI-assisted workflows",
  PROMPT: "Choose how you want to work today.",
  NORMAL_MODE: {
    TITLE: "TERMINAL MODE",
    DESCRIPTION: "Classic terminal experience with multi-pane support",
    SHORTCUT_LABEL: "Ctrl + N"
  },
  AGENTS_MODE: {
    TITLE: "AI ASSISTED MODE",
    DESCRIPTION: "AI-powered environment for collaborative development",
    SHORTCUT_LABEL: "Ctrl + A"
  },
  HINTS: {
    TEMPLATES: "Templates",
    NEW_SPACE: "New Space",
    SETTINGS: "Settings"
  }
};

export const HEADER_CONTENT = {
  NEW_WORKSPACE: "New Workspace",
  NEW_WORKSPACE_SHORTCUT: "(Ctrl+T)",
  TEMPLATES: "Workspace Templates",
  TEMPLATES_SHORTCUT: "(Ctrl+Shift+T)",
  SHORTCUTS: "Keyboard Shortcuts",
  SHORTCUTS_SHORTCUT: "(Ctrl+/)",
  PREFERENCES: "Preferences",
  MINIMIZE: "Minimize",
  MAXIMIZE: "Maximize",
  RESTORE: "Restore",
  CLOSE: "Close"
};

export const FOOTER_CONTENT = {
  THEME_LABEL: "Interface Theme"
};

export const SETUP_CONTENT = {
  TITLE: "CORTEX",
  SUBTITLE: "SPACE",
  WORKSPACE_SETUP: "SET UP YOUR WORKSPACE",
  STEPS: {
    WORKSPACE: "WORKSPACE",
    ASSIGN: "ASSIGN",
    COMMANDS: "COMMANDS",
    PREVIEW: "PREVIEW"
  }
};

export const ONBOARDING_CONTENT = {
  AWAKENING: "PREPARING SYSTEM",
  TITLE: "AI Agent Setup",
  SUBTITLE: "Configure your AI-powered development tools.",
  DETECTED: "Detected",
  INSTALLING: "Installing",
  INSTALL: "Install",
  FAILED: "Failed",
  RETRY: "Retry",
  ACTIVE_AGENTS: (count: number) => `✓ ${count} AI agent${count > 1 ? 's' : ''} ready`,
  NO_AGENTS: "⚠ No AI agents detected",
  CONTINUE: "Enter Workspace",
  CONFIGURING: "Finalizing setup & launching..."
};

export const PANE_SEMANTICS = {
  NEW_PANE: "New Pane",
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
