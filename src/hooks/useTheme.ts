import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  ReactNode,
  createElement,
} from "react";
import { getSetting, setSetting } from "@/lib/store";
import { useColorScheme } from "./useColorScheme";
import { BUILTIN_THEMES } from "@/themes";
import type { Theme, ThemeVariant } from "@/lib/theme-types";

export type ThemeName = string;

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
  raw?: ThemeVariant;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  dark?: ThemePalette;
  light?: ThemePalette;
  isCustom?: boolean;
  isLegacy?: boolean;
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

// ─── Helpers ────────────────────────────────────────────────────────────────

// Only log in development to avoid noise in production builds
const devError = import.meta.env.DEV
  ? (...args: unknown[]) => console.error(...args)
  : () => {};

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
      black: "#111827",
      white: "#FFFFFF",
    },
  };
}

function resolvePalette(themeDef: ThemeDefinition, resolvedScheme: 'light' | 'dark'): { palette: ThemePalette; isDark: boolean } {
  if (themeDef.light && themeDef.dark) {
    if (resolvedScheme === "light") {
      return { palette: themeDef.light, isDark: false };
    } else {
      return { palette: themeDef.dark, isDark: true };
    }
  } else if (themeDef.light) {
    return { palette: themeDef.light, isDark: false };
  } else if (themeDef.dark) {
    if (resolvedScheme === "light" && themeDef.isLegacy) {
      return { palette: generateLightPalette(themeDef.dark), isDark: false };
    } else {
      return { palette: themeDef.dark, isDark: true };
    }
  } else {
    // Extreme fallback
    const fallbackPalette: ThemePalette = {
      bg: "#FAFAFA",
      headerBg: "#FFFFFF",
      footerBg: "#F0F0F0",
      surface: "#FFFFFF",
      border: "#E5E7EB",
      textPrimary: "#111827",
      textSecondary: "#4B5563",
      accent: "#000000",
    };
    return { palette: fallbackPalette, isDark: false };
  }
}

function hexToRgbStr(hex: string): string | null {
  const cleaned = hex.trim().replace(/^#/, "");
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return !isNaN(r) && !isNaN(g) && !isNaN(b) ? `${r}, ${g}, ${b}` : null;
  } else if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return !isNaN(r) && !isNaN(g) && !isNaN(b) ? `${r}, ${g}, ${b}` : null;
  }
  return null;
}

// ─── Built-in themes ─────────────────────────────────────────────────────────

function themeToThemeDefinition(theme: Theme): ThemeDefinition {
  const darkVariant = theme.variants.dark;
  const lightVariant = theme.variants.light;

  const mapVariant = (variant: ThemeVariant): ThemePalette => {
    const colors = variant.colors;
    const terminal = variant.terminal;
    const ansiArray = terminal.ansi;

    const ansiObj = {
      black: ansiArray[0] || "#111111",
      red: ansiArray[1] || "#ff5555",
      green: ansiArray[2] || "#50fa7b",
      yellow: ansiArray[3] || "#f1fa8c",
      blue: ansiArray[4] || "#bd93f9",
      magenta: ansiArray[5] || "#ff79c6",
      cyan: ansiArray[6] || "#8be9fd",
      white: ansiArray[7] || "#f8f8f2",
      brightBlack: ansiArray[8] || "#4D4D4D",
      brightRed: ansiArray[9] || "#FF6E6E",
      brightGreen: ansiArray[10] || "#69FF94",
      brightYellow: ansiArray[11] || "#FFFFA5",
      brightBlue: ansiArray[12] || "#D6ACFF",
      brightMagenta: ansiArray[13] || "#FF92DF",
      brightCyan: ansiArray[14] || "#A4FFFF",
      brightWhite: ansiArray[15] || "#FFFFFF",
    };

    return {
      bg: colors.background,
      headerBg: colors.sidebar,
      footerBg: colors.background,
      surface: colors.card,
      border: colors.border,
      textPrimary: colors.foreground,
      textSecondary: colors.mutedForeground,
      accent: colors.primary,
      ansi: ansiObj,
      raw: variant,
    };
  };

  return {
    id: theme.id,
    name: theme.name,
    dark: darkVariant ? mapVariant(darkVariant) : undefined,
    light: lightVariant ? mapVariant(lightVariant) : undefined,
  };
}

export const DEFAULT_THEMES: Record<string, ThemeDefinition> = {};
Object.entries(BUILTIN_THEMES).forEach(([key, theme]) => {
  DEFAULT_THEMES[key] = themeToThemeDefinition(theme);
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ThemeName>("cortex");
  const [customThemes, setCustomThemes] = useState<ThemeDefinition[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [savedTheme, savedCustom] = await Promise.all([
          getSetting<ThemeName>("cortex_theme", "cortex"),
          getSetting<ThemeDefinition[]>("custom_themes", []),
        ]);

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
                ansi: t.ansi,
              },
              light: t.light,
              isCustom: true,
              isLegacy: true,
            };
          }
          return t;
        });

        setThemeState(savedTheme);
        setCustomThemes(normalizedCustom);
        setIsInitialized(true);
      } catch (err) {
        devError("[ThemeProvider] Error loading theme settings:", err);
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  const allThemesMap = useMemo(() => {
    const combined: Record<string, ThemeDefinition> = { ...DEFAULT_THEMES };
    customThemes.forEach((t) => {
      if (t && t.id) combined[t.id] = { ...t, isCustom: true };
    });
    return combined;
  }, [customThemes]);

  const allThemes = useMemo(
    () => Object.values(allThemesMap),
    [allThemesMap]
  );

  // All CSS variable writes are batched in a single requestAnimationFrame
  // to avoid triggering multiple style recalculations per theme change.
  const applyThemeToDocument = useCallback((config: ThemePalette, themeId?: string, isDark?: boolean) => {
    requestAnimationFrame(() => {
      const root = document.documentElement;
      if (themeId) {
        root.setAttribute("data-theme", themeId);
      }

      if (isDark !== undefined) {
        root.setAttribute("data-color-scheme", isDark ? "dark" : "light");
        if (isDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }

      const setHexAndRgb = (propName: string, hex: string) => {
        if (!hex) return;
        root.style.setProperty(propName, hex);
        const rgb = hexToRgbStr(hex);
        if (rgb) root.style.setProperty(`${propName}-rgb`, rgb);
      };

      setHexAndRgb("--bg-color", config.bg);
      setHexAndRgb("--header-bg", config.headerBg);
      setHexAndRgb("--footer-bg", config.footerBg);
      setHexAndRgb("--surface-color", config.surface);
      setHexAndRgb("--border-color", config.border);
      setHexAndRgb("--text-primary", config.textPrimary);
      setHexAndRgb("--text-secondary", config.textSecondary);
      setHexAndRgb("--accent-primary", config.accent);

      const ansi = config.ansi || {};
      const ansiDefaults = {
        black: "#111111",
        red: "#FF5555",
        green: "#50FA7B",
        yellow: "#F1FA8C",
        blue: "#BD93F9",
        magenta: "#FF79C6",
        cyan: "#8BE9FD",
        white: "#F8F8F2",
        brightBlack: "#4D4D4D",
        brightRed: "#FF6E6E",
        brightGreen: "#69FF94",
        brightYellow: "#FFFFA5",
        brightBlue: "#D6ACFF",
        brightMagenta: "#FF92DF",
        brightCyan: "#A4FFFF",
        brightWhite: "#FFFFFF",
      };

      Object.entries(ansiDefaults).forEach(([key, defaultValue]) => {
        const color = (ansi as any)[key] || defaultValue;
        const varName = `--ansi-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
        root.style.setProperty(varName, color);
        const rgb = hexToRgbStr(color);
        if (rgb) root.style.setProperty(`${varName}-rgb`, rgb);
      });

      // Respect the theme's mode for button text contrast:
      // - In dark mode, the accent button background is typically bright, so the text should be a dark color based on the theme (e.g., config.bg or config.surface).
      // - In light mode, the accent button background is typically dark/saturated, so the text should be a light color based on the theme (e.g., config.bg, config.surface, or white).
      const resolvedDark = isDark !== undefined ? isDark : true;
      const accentContrast = resolvedDark
        ? (config.bg || "#0c0c0e")
        : (config.bg && config.bg.toLowerCase() !== "#ffffff" ? config.bg : "#ffffff");

      root.style.setProperty("--accent-contrast", accentContrast);

      // Write standard shadcn CSS variables if raw colors are available
      if (config.raw) {
        const colors = config.raw.colors;
        const terminal = config.raw.terminal;

        const setRawVar = (name: string, value: string) => {
          if (!value) return;
          const kebab = name.replace(/([A-Z])/g, "-$1").toLowerCase();
          root.style.setProperty(`--${kebab}`, value);
          const rgb = hexToRgbStr(value);
          if (rgb) root.style.setProperty(`--${kebab}-rgb`, rgb);
        };

        Object.entries(colors).forEach(([key, value]) => {
          setRawVar(key, value);
        });

        if (terminal.cursor) root.style.setProperty("--terminal-cursor", terminal.cursor);
        if (terminal.cursorAccent) root.style.setProperty("--terminal-cursor-accent", terminal.cursorAccent);
        if (terminal.selection) root.style.setProperty("--terminal-selection", terminal.selection);
      }
    });
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const themeDef = allThemesMap[theme] || DEFAULT_THEMES["cortex"];
      const { palette, isDark } = resolvePalette(themeDef, resolvedScheme);
      applyThemeToDocument(palette, theme, isDark);
      setSetting("cortex_theme", theme);
    }
  }, [theme, resolvedScheme, isInitialized, allThemesMap, applyThemeToDocument]);

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
  }, []);

  const addCustomTheme = useCallback(async (newTheme: ThemeDefinition) => {
    setCustomThemes((prev) => {
      const updated = [...prev.filter((t) => t.id !== newTheme.id), newTheme];
      setSetting("custom_themes", updated);
      return updated;
    });
  }, []);

  const removeCustomTheme = useCallback(async (id: string) => {
    setCustomThemes((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      setSetting("custom_themes", updated);
      return updated;
    });
    setThemeState((prev) => (prev === id ? "cortex" : prev));
  }, []);

  const previewTheme = useCallback(
    (def: ThemeDefinition) => {
      const { palette, isDark } = resolvePalette(def, resolvedScheme);
      applyThemeToDocument(palette, def.id, isDark);
    },
    [resolvedScheme, applyThemeToDocument]
  );

  const cancelPreview = useCallback(() => {
    const themeDef = allThemesMap[theme] || DEFAULT_THEMES["cortex"];
    const { palette, isDark } = resolvePalette(themeDef, resolvedScheme);
    applyThemeToDocument(palette, theme, isDark);
  }, [theme, resolvedScheme, allThemesMap, applyThemeToDocument]);

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      allThemes,
      addCustomTheme,
      removeCustomTheme,
      previewTheme,
      cancelPreview,
    }),
    [
      theme,
      setTheme,
      allThemes,
      addCustomTheme,
      removeCustomTheme,
      previewTheme,
      cancelPreview,
    ]
  );

  return createElement(
    ThemeContext.Provider,
    { value: contextValue },
    children
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
