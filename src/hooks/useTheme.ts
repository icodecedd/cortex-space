import { useEffect, useState, useCallback, useMemo, createContext, useContext, ReactNode, createElement } from 'react';
import { getSetting, setSetting } from '@/lib/store';
import { useColorScheme } from './useColorScheme';

export type ThemeName = string;

export interface AnsiColors {
  black: string;
  red: string;
  green: string; yellow: string; blue: string; magenta: string; cyan: string; white: string;
  brightBlack: string; brightRed: string; brightGreen: string; brightYellow: string; brightBlue: string; brightMagenta: string; brightCyan: string; brightWhite: string;
}

export interface ThemePalette {
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

export interface ThemeDefinition {
  id: string;
  name: string;
  dark: ThemePalette;
  light?: ThemePalette; // Optional, will auto-invert if missing
  isCustom?: boolean;
}

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  allThemes: ThemeDefinition[];
  addCustomTheme: (newTheme: ThemeDefinition) => Promise<void>;
  removeCustomTheme: (id: string) => Promise<void>;
  previewTheme: (def: ThemeDefinition) => void;
  cancelPreview: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Helper: Auto-Invert Utility ─────────────────────────────────────────────
function generateLightPalette(dark: ThemePalette): ThemePalette {
  return {
    bg: "#FAFAFA",
    headerBg: "#FFFFFF",
    footerBg: "#F0F0F0",
    surface: "#FFFFFF",
    border: "#E5E7EB",
    textPrimary: "#111827",
    textSecondary: "#4B5563",
    accent: dark.accent,
    ansi: {
      ...dark.ansi,
      black: '#111827',
      white: '#FFFFFF'
    }
  };
}

// Helper to convert hex to rgb string format "r, g, b"
function hexToRgbStr(hex: string): string | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return (!isNaN(r) && !isNaN(g) && !isNaN(b)) ? `${r}, ${g}, ${b}` : null;
  } else if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return (!isNaN(r) && !isNaN(g) && !isNaN(b)) ? `${r}, ${g}, ${b}` : null;
  }
  return null;
}

export const DEFAULT_THEMES: Record<string, ThemeDefinition> = {
  claude: {
    id: 'claude',
    name: "Claude",
    dark: {
      bg: "#141413",
      headerBg: "#1C1C1B",
      footerBg: "#141413",
      surface: "#1C1C1B",
      border: "#2B2B29",
      textPrimary: "#E6E6E3",
      textSecondary: "#91918E",
      accent: "#D97757",
      ansi: { black: '#1C1C1B', red: '#D97757', green: '#A6CC70', yellow: '#FAD07B', blue: '#6DCBFA', magenta: '#CFBAFA', cyan: '#90E1C6', white: '#E6E6E3' }
    },
    light: {
      bg: "#F7F7F5",
      headerBg: "#FFFFFF",
      footerBg: "#F7F7F5",
      surface: "#FFFFFF",
      border: "#E6E6E3",
      textPrimary: "#141413",
      textSecondary: "#4A4A48",
      accent: "#D97757",
      ansi: { black: '#141413', red: '#BF4727', green: '#5B7A24', yellow: '#946B10', blue: '#206D94', magenta: '#6D5094', cyan: '#398C71', white: '#FFFFFF' }
    }
  },
  cursor: {
    id: 'cursor',
    name: "Cursor",
    dark: {
      bg: "#0A0A0A",
      headerBg: "#121212",
      footerBg: "#0A0A0A",
      surface: "#121212",
      border: "#1F1F1F",
      textPrimary: "#E0E0E0",
      textSecondary: "#757575",
      accent: "#3E8FB0",
      ansi: { black: '#121212', red: '#FF8080', green: '#95FFA4', yellow: '#FFFF9E', blue: '#3E8FB0', magenta: '#FF9BFF', cyan: '#9BFFFF', white: '#E0E0E0' }
    },
    light: {
      bg: "#FFFFFF",
      headerBg: "#F8F9FA",
      footerBg: "#FFFFFF",
      surface: "#F8F9FA",
      border: "#E9ECEF",
      textPrimary: "#111827",
      textSecondary: "#4B5563",
      accent: "#007BFF",
      ansi: { black: '#111827', red: '#DC3545', green: '#28A745', yellow: '#D39E00', blue: '#007BFF', magenta: '#BD2130', cyan: '#17A2B8', white: '#FFFFFF' }
    }
  },
  cortex: {
    id: 'cortex',
    name: "Cortex Default",
    dark: {
      bg: "#0A0A0A",
      headerBg: "#111111",
      footerBg: "#0A0A0A",
      surface: "#161616",
      border: "#262626",
      textPrimary: "#FFFFFF",
      textSecondary: "#A3A3A3",
      accent: "#FF66B2",
      ansi: { black: '#111111', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c', blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2' }
    },
    light: {
      bg: "#FFFFFF",
      headerBg: "#F5F5F7",
      footerBg: "#FFFFFF",
      surface: "#FFFFFF",
      border: "#D1D1D1",
      textPrimary: "#000000",
      textSecondary: "#525252",
      accent: "#FF66B2",
      ansi: { black: '#000000', red: '#D13438', green: '#107C10', yellow: '#C19C00', blue: '#0078D4', magenta: '#B4009E', cyan: '#008272', white: '#FFFFFF' }
    }
  },
  tokyo: {
    id: 'tokyo',
    name: "Tokyo Night",
    dark: {
      bg: "#1A1B26",
      headerBg: "#1F2335",
      footerBg: "#1A1B26",
      surface: "#24283B",
      border: "#414868",
      textPrimary: "#A9B1D6",
      textSecondary: "#7A88CF",
      accent: "#7AA2F7",
      ansi: { black: '#414868', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68', blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#c0caf5' }
    },
    light: {
      bg: "#FAFAFA",
      headerBg: "#F0F1F5",
      footerBg: "#FAFAFA",
      surface: "#FFFFFF",
      border: "#D1D5DB",
      textPrimary: "#24283B",
      textSecondary: "#565A6E",
      accent: "#2E7DE5",
      ansi: { black: '#24283B', red: '#8C4351', green: '#485E30', yellow: '#8F5E15', blue: '#34548A', magenta: '#5A4A78', cyan: '#166775', white: '#FFFFFF' }
    }
  },
  nord: {
    id: 'nord',
    name: "Nord",
    dark: {
      bg: "#2E3440",
      headerBg: "#3B4252",
      footerBg: "#2E3440",
      surface: "#3B4252",
      border: "#4C566A",
      textPrimary: "#D8DEE9",
      textSecondary: "#ABB9CF",
      accent: "#88C0D0",
      ansi: { black: '#3B4252', red: '#BF616A', green: '#A3BE8C', yellow: '#EBCB8B', blue: '#81A1C1', magenta: '#B48EAD', cyan: '#88C0D0', white: '#E5E9F0' }
    },
    light: {
      bg: "#FAFAFA",
      headerBg: "#ECEFF4",
      footerBg: "#FAFAFA",
      surface: "#FFFFFF",
      border: "#D1D5DB",
      textPrimary: "#2E3440",
      textSecondary: "#4C566A",
      accent: "#5E81AC",
      ansi: { black: '#2E3440', red: '#A04A53', green: '#6B8E4E', yellow: '#9A6B41', blue: '#43618C', magenta: '#8C5A78', cyan: '#5A8B9A', white: '#FFFFFF' }
    }
  },
  catppuccin: {
    id: 'catppuccin',
    name: "Catppuccin",
    dark: {
      bg: "#181825",
      headerBg: "#1E1E2E",
      footerBg: "#181825",
      surface: "#1E1E2E",
      border: "#313244",
      textPrimary: "#CDD6F4",
      textSecondary: "#7F849C",
      accent: "#89B4FA",
      ansi: { black: '#45475A', red: '#F38BA8', green: '#A6E3A1', yellow: '#F9E2AF', blue: '#89B4FA', magenta: '#F5C2E7', cyan: '#94E2D5', white: '#BAC2DE' }
    },
    light: {
      bg: "#FAFAFA",
      headerBg: "#EFF1F5",
      footerBg: "#FAFAFA",
      surface: "#FFFFFF",
      border: "#D1D5DB",
      textPrimary: "#4C4F69",
      textSecondary: "#5C5F77",
      accent: "#1E66F5",
      ansi: { black: '#4C4F69', red: '#D20F39', green: '#40A02B', yellow: '#DF8E1D', blue: '#1E66F5', magenta: '#EA76CB', cyan: '#179299', white: '#FFFFFF' }
    }
  },
  caffeine: {
    id: 'caffeine',
    name: "Caffeine",
    dark: {
      bg: "#141210",
      headerBg: "#1C1917",
      footerBg: "#141210",
      surface: "#1C1917",
      border: "#2D2722",
      textPrimary: "#D4BE98",
      textSecondary: "#897F73",
      accent: "#D8A657",
      ansi: { black: '#1C1917', red: '#EA6962', green: '#A9B665', yellow: '#D8A657', blue: '#7DAEA3', magenta: '#D3869B', cyan: '#89B482', white: '#D4BE98' }
    },
    light: {
      bg: "#FAFAFA",
      headerBg: "#F2E9E1",
      footerBg: "#FAFAFA",
      surface: "#FFFFFF",
      border: "#D1D5DB",
      textPrimary: "#5A4B41",
      textSecondary: "#5A4B41",
      accent: "#A67C37",
      ansi: { black: '#5A4B41', red: '#AF3A03', green: '#606400', yellow: '#B57614', blue: '#076678', magenta: '#8F3F71', cyan: '#427B58', white: '#FFFFFF' }
    }
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ThemeName>('cortex');
  const [customThemes, setCustomThemes] = useState<ThemeDefinition[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from store on mount
  useEffect(() => {
    async function init() {
      try {
        const [savedTheme, savedCustom] = await Promise.all([
          getSetting<ThemeName>("cortex_theme", 'cortex'),
          getSetting<ThemeDefinition[]>("custom_themes", [])
        ]);
        
        console.log(`[ThemeProvider] Loaded theme: ${savedTheme}, custom count: ${savedCustom?.length || 0}`);
        
        const normalizedCustom = (savedCustom || []).map((t: any) => {
          if (t && !t.dark && t.bg) {
            return {
              id: t.id,
              name: t.name,
              dark: {
                bg: t.bg,
                headerBg: t.headerBg,
                footerBg: t.footerBg,
                surface: t.surface,
                border: t.border,
                textPrimary: t.textPrimary,
                textSecondary: t.textSecondary,
                accent: t.accent,
                ansi: t.ansi
              },
              light: t.light,
              isCustom: true
            };
          }
          return t;
        });

        setThemeState(savedTheme);
        setCustomThemes(normalizedCustom);
        setIsInitialized(true);
      } catch (err) {
        console.error("[ThemeProvider] Error loading theme settings:", err);
        setIsInitialized(true); // fallback
      }
    }
    init();
  }, []);

  const allThemesMap = useMemo(() => {
    const combined: Record<string, ThemeDefinition> = { ...DEFAULT_THEMES };
    customThemes.forEach(t => {
      if (t && t.id) {
        combined[t.id] = { ...t, isCustom: true };
      }
    });
    return combined;
  }, [customThemes]);

  const allThemes = useMemo(() => Object.values(allThemesMap), [allThemesMap]);

  const applyThemeToDocument = useCallback((config: ThemePalette) => {
    console.log(`[ThemeProvider] applyThemeToDocument:`, config);
    const root = document.documentElement;

    const setHexAndRgb = (propName: string, hex: string) => {
      if (!hex) return;
      root.style.setProperty(propName, hex);
      const rgb = hexToRgbStr(hex);
      if (rgb) {
        root.style.setProperty(`${propName}-rgb`, rgb);
      }
    };

    setHexAndRgb('--bg-color', config.bg);
    setHexAndRgb('--header-bg', config.headerBg);
    setHexAndRgb('--footer-bg', config.footerBg);
    setHexAndRgb('--surface-color', config.surface);
    setHexAndRgb('--border-color', config.border);
    setHexAndRgb('--text-primary', config.textPrimary);
    setHexAndRgb('--text-secondary', config.textSecondary);
    setHexAndRgb('--accent-primary', config.accent);

    const ansi = config.ansi || {};
    const ansiDefaults = {
      black: '#111111', red: '#FF5555', green: '#50FA7B', yellow: '#F1FA8C',
      blue: '#BD93F9', magenta: '#FF79C6', cyan: '#8BE9FD', white: '#F8F8F2',
      brightBlack: '#4D4D4D', brightRed: '#FF6E6E', brightGreen: '#69FF94', brightYellow: '#FFFFA5',
      brightBlue: '#D6ACFF', brightMagenta: '#FF92DF', brightCyan: '#A4FFFF', brightWhite: '#FFFFFF'
    };

    Object.entries(ansiDefaults).forEach(([key, defaultValue]) => {
      const color = (ansi as any)[key] || defaultValue;
      const varName = `--ansi-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(varName, color);
      
      const rgb = hexToRgbStr(color);
      if (rgb) {
        root.style.setProperty(`${varName}-rgb`, rgb);
      }
    });

    const isLightAccent = config.accent && (config.accent.toLowerCase() === '#ffffff' || config.accent.toLowerCase() === '#e6e6e3');
    root.style.setProperty('--accent-contrast', isLightAccent ? '#000000' : '#ffffff');
  }, []);

  // Theme application side effect
  useEffect(() => {
    if (isInitialized) {
      const themeDef = allThemesMap[theme] || DEFAULT_THEMES['cortex'];
      console.log(`[ThemeProvider] Applying theme: ${theme}`, themeDef);
      const palette = resolvedScheme === 'light' 
        ? (themeDef.light || generateLightPalette(themeDef.dark)) 
        : themeDef.dark;
      
      applyThemeToDocument(palette);
      setSetting("cortex_theme", theme);
    }
  }, [theme, resolvedScheme, isInitialized, allThemesMap, applyThemeToDocument]);

  const setTheme = useCallback((newTheme: ThemeName) => {
    console.log(`[ThemeProvider] setTheme called: ${newTheme}`);
    setThemeState(newTheme);
  }, []);

  const addCustomTheme = useCallback(async (newTheme: ThemeDefinition) => {
    setCustomThemes(prev => {
      const updated = [...prev.filter(t => t.id !== newTheme.id), newTheme];
      setSetting("custom_themes", updated);
      return updated;
    });
  }, []);

  const removeCustomTheme = useCallback(async (id: string) => {
    setCustomThemes(prev => {
      const updated = prev.filter(t => t.id !== id);
      setSetting("custom_themes", updated);
      return updated;
    });
    setThemeState(prev => {
      const nextTheme = prev === id ? 'cortex' : prev;
      return nextTheme;
    });
  }, []);

  const previewTheme = useCallback((def: ThemeDefinition) => {
    console.log(`[ThemeProvider] Preview theme:`, def.name);
    const palette = resolvedScheme === 'light' 
      ? (def.light || generateLightPalette(def.dark)) 
      : def.dark;
    applyThemeToDocument(palette);
  }, [resolvedScheme, applyThemeToDocument]);

  const cancelPreview = useCallback(() => {
    console.log(`[ThemeProvider] Cancel preview. Restoring theme: ${theme}`);
    const themeDef = allThemesMap[theme] || DEFAULT_THEMES['cortex'];
    const palette = resolvedScheme === 'light' 
      ? (themeDef.light || generateLightPalette(themeDef.dark)) 
      : themeDef.dark;
    applyThemeToDocument(palette);
  }, [theme, resolvedScheme, allThemesMap, applyThemeToDocument]);

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    allThemes,
    addCustomTheme,
    removeCustomTheme,
    previewTheme,
    cancelPreview
  }), [theme, setTheme, allThemes, addCustomTheme, removeCustomTheme, previewTheme, cancelPreview]);

  return createElement(ThemeContext.Provider, { value: contextValue }, children);
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
