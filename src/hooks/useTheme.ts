import { useEffect, useState, useCallback } from 'react';
import { getSetting, setSetting } from '@/lib/store';

export type ThemeName = 'ayu' | 'catppuccin' | 'iceberg' | 'nvim' | 'monochrome' | 'soft-monochrome' | 'cortex';

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
}

const THEMES: Record<ThemeName, ThemeDefinition> = {
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
