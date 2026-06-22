export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  radius?: string;
}

export interface TerminalTheme {
  cursor: string;
  cursorAccent: string;
  selection: string;
  ansi: string[];
}

export interface ThemeVariant {
  colors: ThemeColors;
  terminal: TerminalTheme;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  editorTheme: {
    dark?: string;
    light?: string;
  };
  variants: {
    dark?: ThemeVariant;
    light?: ThemeVariant;
  };
}
