import { load } from '@tauri-apps/plugin-store';
import defaults from "@/data/defaults.json";

// We load the store lazily. In Tauri v2, load() returns a promise.
// 'settings.json' (or 'settings.dev.json' in dev mode) will be stored in the app's config directory.
const storeFilename = import.meta.env.DEV ? 'settings.dev.json' : 'settings.json';
const storePromise = load(storeFilename, { autoSave: true, defaults: {} });

export const getStore = () => storePromise;

// Typed cache to avoid 'any'
type SettingsCache = Record<string, unknown>;
let cachedStore: SettingsCache | null = null;
let cachePromise: Promise<SettingsCache> | null = null;

async function ensureCache(): Promise<SettingsCache> {
  if (cachedStore) return cachedStore;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    try {
      const store = await getStore();
      const entries = await store.entries();
      const cache: SettingsCache = {};
      for (const [key, value] of entries) {
        cache[key] = value;
      }
      cachedStore = cache;
      return cache;
    } catch (e) {
      console.warn("[Store] Failed to load store entries for cache:", e);
      cachedStore = {};
      return cachedStore;
    }
  })();

  return cachePromise;
}

export async function setSetting<T>(key: string, value: T) {
  const store = await getStore();
  await store.set(key, value);
  
  // Update cache
  if (cachedStore) {
    cachedStore[key] = value;
  } else if (cachePromise) {
    const cache = await cachePromise;
    cache[key] = value;
  }
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const cache = await ensureCache();
  const val = cache[key];
  return val !== null && val !== undefined ? (val as T) : defaultValue;
}

export async function clearAllSettings() {
  const store = await getStore();
  await store.clear();
  cachedStore = {};
  if (cachePromise) cachePromise = Promise.resolve({});
}

// ---------------------------------------------------------------------------
// Typed settings schemas
// ---------------------------------------------------------------------------

export type CursorStyle = 'block' | 'underline' | 'bar';
export type ColorScheme = 'system' | 'light' | 'dark';
export type StartupBehavior = 'modeSelector' | 'lastMode' | 'newTerminal' | 'newAgents';

export interface TerminalSettings {
  [key: string]: unknown;
  fontSize: number;
  fontFamily: string;
  scrollbackLines: number;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: string;
}

export interface StartupSettings {
  [key: string]: unknown;
  showSplashAnimation: boolean;
  behavior: StartupBehavior;
  checkForUpdatesOnStartup: boolean;
  confirmModeChange: boolean;
  defaultShell: string;
}

export interface AppearanceSettings {
  [key: string]: unknown;
  colorScheme: ColorScheme;
  uiFontScale: number;
  zenPadding: number;
  reducedMotion: boolean;
  shimmerPreset: string;
  shimmerDuration: number;
}

export interface ShortcutSettings {
  [key: string]: string;
  toggleZenMode: string;
  newWorkspace: string;
  closeWorkspace: string;
  cycleNextWorkspace: string;
  cyclePrevWorkspace: string;
  openShortcuts: string;
  openTemplates: string;
  openSettings: string;
  quickSwitcher: string;
  splitHorizontal: string;
  splitVertical: string;
  resetPane: string;
  closePane: string;
  switchNormalMode: string;
  switchAgentsMode: string;
}

export interface FocusSettings {
  [key: string]: unknown;
  isZenMode: boolean;
  showTabs: boolean;
  showStatusBar: boolean;
  showPaneHeaders: boolean;
  customLayoutMode: 'grid' | 'count';
  sidebarLayout: 'horizontal' | 'vertical';
  sidebarCollapsed: boolean;
}

export interface DemoSettings {
  [key: string]: unknown;
  showWorkspacesTab: boolean;
  showTemplatesButton: boolean;
  showShortcutsButton: boolean;
  showModeShortcutHints: boolean;
  showTerminalShortcutHints: boolean;
  showFloatingTerminalHeader: boolean;
  terminalHeaderVisibility: 'hover' | 'always';
  enableBrowserRefresh: boolean;
}

export interface SemanticsPattern {
  bin: string[];
  sub: string[];
  fallback: string;
}

export interface SemanticsSettings {
  [key: string]: unknown;
  tools: Record<string, string>;
  patterns: SemanticsPattern[];
}

export const TERMINAL_DEFAULTS: TerminalSettings = defaults.terminal as TerminalSettings;

export const STARTUP_DEFAULTS: StartupSettings = defaults.startup as StartupSettings;

export const APPEARANCE_DEFAULTS: AppearanceSettings = defaults.appearance as AppearanceSettings;

export const FOCUS_DEFAULTS: FocusSettings = defaults.focus as FocusSettings;

export const DEMO_DEFAULTS: DemoSettings = defaults.demo as DemoSettings;

export const SHORTCUT_DEFAULTS: ShortcutSettings = defaults.shortcuts as ShortcutSettings;

export const SEMANTICS_DEFAULTS: SemanticsSettings = defaults.semantics as SemanticsSettings;

// ---------------------------------------------------------------------------
// Group helpers — batch read/write flat dot-separated keys for a settings group
// ---------------------------------------------------------------------------

export async function getSettingsGroup<T extends Record<string, unknown>>(
  prefix: string,
  defaults: T
): Promise<T> {
  const result = { ...defaults };
  await Promise.all(
    (Object.keys(defaults) as Array<keyof T>).map(async (key) => {
      const storeKey = `${prefix}.${String(key)}`;
      const val = await getSetting(storeKey, defaults[key]);
      (result as Record<string, unknown>)[String(key)] = val;
    })
  );
  return result;
}

export async function setSettingsGroup<T extends Record<string, unknown>>(
  prefix: string,
  values: Partial<T>
): Promise<void> {
  await Promise.all(
    Object.entries(values).map(([key, val]) =>
      setSetting(`${prefix}.${key}`, val)
    )
  );
}
