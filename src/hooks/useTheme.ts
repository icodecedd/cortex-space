import { useEffect, useState, useCallback } from 'react';

export type ThemeName = 'ayu' | 'catppuccin' | 'iceberg' | 'nvim' | 'monochrome' | 'soft-monochrome';

interface ThemeDefinition {
  name: string;
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}

const THEMES: Record<ThemeName, ThemeDefinition> = {
  ayu: {
    name: "Ayu Mirage",
    bg: "#1f2430",
    surface: "#191e2a",
    border: "#33415e",
    textPrimary: "#cbccc6",
    textSecondary: "#707a8c",
    accent: "#ffcc66",
  },
  catppuccin: {
    name: "Catppuccin Mocha",
    bg: "#1e1e2e",
    surface: "#181825",
    border: "#313244",
    textPrimary: "#cdd6f4",
    textSecondary: "#7f849c",
    accent: "#89b4fa",
  },
  iceberg: {
    name: "Iceberg Dark",
    bg: "#161821",
    surface: "#1e2132",
    border: "#242940",
    textPrimary: "#c6c8d1",
    textSecondary: "#6b7089",
    accent: "#84a0c6",
  },
  nvim: {
    name: "Nvim Dark",
    bg: "#14161b",
    surface: "#07080d",
    border: "#2a2d37",
    textPrimary: "#e0e2ea",
    textSecondary: "#4f5258",
    accent: "#a6dbff",
  },
  monochrome: {
    name: "Monochromatic Luxe",
    bg: "#050505",
    surface: "#0f0f0f",
    border: "#1f1f1f",
    textPrimary: "#ffffff",
    textSecondary: "#737373",
    accent: "#ffffff",
  },
  'soft-monochrome': {
    name: "Soft Monochrome",
    bg: "#121212",
    surface: "#1a1a1a",
    border: "#2a2a2a",
    textPrimary: "#e5e5e5",
    textSecondary: "#8a8a8a",
    accent: "#e5e5e5",
  }
};

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>('soft-monochrome');

  const applyTheme = useCallback((name: ThemeName) => {
    const config = THEMES[name];
    const root = document.documentElement;

    root.style.setProperty('--bg-color', config.bg);
    root.style.setProperty('--surface-color', config.surface);
    root.style.setProperty('--border-color', config.border);
    root.style.setProperty('--text-primary', config.textPrimary);
    root.style.setProperty('--text-secondary', config.textSecondary);
    root.style.setProperty('--accent-primary', config.accent);

    // Default derived values for the "Premium" look
    root.style.setProperty('--pane-shadow', 'inset 0 1px 1px 0 rgba(0,0,0,0.1)');
    root.style.setProperty('--pane-border-top', 'none');
    root.style.setProperty('--hardware-light', 'none');
    root.style.setProperty('--accent-contrast', '#000000');
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return { theme, setTheme };
}
