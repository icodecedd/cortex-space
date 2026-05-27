import { useEffect, useState, useCallback } from 'react';
import { getSetting, setSetting } from '@/lib/store';

export type ThemeName = 'ayu' | 'catppuccin' | 'iceberg' | 'nvim' | 'monochrome' | 'soft-monochrome' | 'cortex';

export interface AnsiColors {
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

interface ThemeDefinition {
  name: string;
  bg: string;
  headerBg: string;
  footerBg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  ansi?: Partial<AnsiColors>;
}

export const THEMES: Record<ThemeName, ThemeDefinition> = {
  ayu: {
    name: "Ayu Mirage",
    bg: "#1a1f29",
    headerBg: "#232a36",
    footerBg: "#1f2430",
    surface: "#191e2a",
    border: "#33415e",
    textPrimary: "#cbccc6",
    textSecondary: "#707a8c",
    accent: "#ffcc66",
    ansi: {
      black: '#191e2a',
      red: '#ed8274',
      green: '#a6cc70',
      yellow: '#fad07b',
      blue: '#6dcbfa',
      magenta: '#cfbafa',
      cyan: '#90e1c6',
      white: '#c7c7c7',
    }
  },
  catppuccin: {
    name: "Catppuccin Mocha",
    bg: "#181825",
    headerBg: "#242434",
    footerBg: "#1e1e2e",
    surface: "#181825",
    border: "#313244",
    textPrimary: "#cdd6f4",
    textSecondary: "#7f849c",
    accent: "#89b4fa",
    ansi: {
      black: '#45475a',
      red: '#f38ba8',
      green: '#a6e3a1',
      yellow: '#f9e2af',
      blue: '#89b4fa',
      magenta: '#f5c2e7',
      cyan: '#94e2d5',
      white: '#bac2de',
    }
  },
  iceberg: {
    name: "Iceberg Dark",
    bg: "#11131a",
    headerBg: "#1b1e28",
    footerBg: "#161821",
    surface: "#1e2132",
    border: "#242940",
    textPrimary: "#c6c8d1",
    textSecondary: "#6b7089",
    accent: "#84a0c6",
    ansi: {
      black: '#161821',
      red: '#e27878',
      green: '#b4be82',
      yellow: '#e2a478',
      blue: '#84a0c6',
      magenta: '#a093c7',
      cyan: '#89b8c2',
      white: '#c6c8d1',
    }
  },
  nvim: {
    name: "Nvim Dark",
    bg: "#101115",
    headerBg: "#191b21",
    footerBg: "#14161b",
    surface: "#07080d",
    border: "#2a2d37",
    textPrimary: "#e0e2ea",
    textSecondary: "#4f5258",
    accent: "#a6dbff",
    ansi: {
      black: '#011627',
      red: '#ef5350',
      green: '#22da6e',
      yellow: '#addb67',
      blue: '#82aaff',
      magenta: '#c792ea',
      cyan: '#21c7a8',
      white: '#ffffff',
    }
  },
  monochrome: {
    name: "Monochromatic Luxe",
    bg: "#050505",
    headerBg: "#151515",
    footerBg: "#0d0d0d",
    surface: "#0f0f0f",
    border: "#1f1f1f",
    textPrimary: "#ffffff",
    textSecondary: "#737373",
    accent: "#ffffff",
    ansi: {
      black: '#000000',
      red: '#ffffff',
      green: '#ffffff',
      yellow: '#ffffff',
      blue: '#ffffff',
      magenta: '#ffffff',
      cyan: '#ffffff',
      white: '#ffffff',
    }
  },
  'soft-monochrome': {
    name: "Soft Monochrome",
    bg: "#121212",
    headerBg: "#1e1e1e",
    footerBg: "#161616",
    surface: "#1a1a1a",
    border: "#2a2a2a",
    textPrimary: "#e5e5e5",
    textSecondary: "#8a8a8a",
    accent: "#e5e5e5",
    ansi: {
      black: '#121212',
      red: '#e5e5e5',
      green: '#e5e5e5',
      yellow: '#e5e5e5',
      blue: '#e5e5e5',
      magenta: '#e5e5e5',
      cyan: '#e5e5e5',
      white: '#e5e5e5',
    }
  },
  cortex: {
    name: "Cortex Default",
    bg: "#090B0C",
    headerBg: "#161B1D",
    footerBg: "#111416",
    surface: "#121517",
    border: "#252B2E",
    textPrimary: "#E2E2EC",
    textSecondary: "#6B6B80",
    accent: "#FF3399",
    ansi: {
      black: '#000000',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2',
    }
  }
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>('soft-monochrome');
  const [isInitialized, setIsInitialized] = useState(false);

  const applyTheme = useCallback((name: ThemeName) => {
    const config = THEMES[name];
    if (!config) return;
    
    const root = document.documentElement;

    root.style.setProperty('--bg-color', config.bg);
    root.style.setProperty('--header-bg', config.headerBg);
    root.style.setProperty('--footer-bg', config.footerBg);
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
    async function init() {
      const saved = await getSetting<ThemeName>("cortex_theme", 'soft-monochrome');
      setThemeState(saved);
      setIsInitialized(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      applyTheme(theme);
      setSetting("cortex_theme", theme);
    }
  }, [theme, applyTheme, isInitialized]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  return { theme, setTheme };
}
