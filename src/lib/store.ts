import { load } from '@tauri-apps/plugin-store';

// We load the store lazily. In Tauri v2, load() returns a promise.
// 'settings.json' will be stored in the app's config directory.
const storePromise = load('settings.json', { autoSave: true, defaults: {} });

export const getStore = () => storePromise;

export async function setSetting<T>(key: string, value: T) {
  const store = await getStore();
  await store.set(key, value);
  // autoSave is true, but we can call save() explicitly if we want to be certain
  await store.save();
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const store = await getStore();
  const val = await store.get<T>(key);
  return val !== null && val !== undefined ? val : defaultValue;
}

// ---------------------------------------------------------------------------
// Typed settings schemas
// ---------------------------------------------------------------------------

export type CursorStyle = 'block' | 'underline' | 'bar';
export type ColorScheme = 'system' | 'light' | 'dark';
export type OpenOnLaunch = 'modeSelector' | 'newTerminal';

export interface TerminalSettings {
  [key: string]: unknown;
  fontSize: number;
  fontFamily: string;
  scrollbackLines: number;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
  lineHeight: number;
  letterSpacing: number;
}

export interface StartupSettings {
  [key: string]: unknown;
  showSplashAnimation: boolean;
  rememberLastMode: boolean;
  openOnLaunch: OpenOnLaunch;
  checkForUpdatesOnStartup: boolean;
  defaultShell: string;
}

export interface AppearanceSettings {
  [key: string]: unknown;
  colorScheme: ColorScheme;
  uiFontScale: number;
  zenPadding: number;
  reducedMotion: boolean;
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
}

export interface FocusSettings {
  [key: string]: unknown;
  isZenMode: boolean;
  showTabs: boolean;
  showStatusBar: boolean;
  showPaneHeaders: boolean;
}

export const TERMINAL_DEFAULTS: TerminalSettings = {
  fontSize: 12,
  fontFamily: 'JetBrains Mono',
  scrollbackLines: 1000,
  cursorStyle: 'block',
  cursorBlink: true,
  lineHeight: 1.2,
  letterSpacing: 0,
};

export const STARTUP_DEFAULTS: StartupSettings = {
  showSplashAnimation: true,
  rememberLastMode: false,
  openOnLaunch: 'modeSelector',
  checkForUpdatesOnStartup: true,
  defaultShell: '',
};

export const APPEARANCE_DEFAULTS: AppearanceSettings = {
  colorScheme: 'dark',
  uiFontScale: 100,
  zenPadding: 32,
  reducedMotion: false,
};

export const FOCUS_DEFAULTS: FocusSettings = {
  isZenMode: false,
  showTabs: false,
  showStatusBar: false,
  showPaneHeaders: false,
};

export const SHORTCUT_DEFAULTS: ShortcutSettings = {
  toggleZenMode: 'Ctrl+Shift+Z',
  newWorkspace: 'Ctrl+Alt+N',
  closeWorkspace: 'Ctrl+Shift+W',
  cycleNextWorkspace: 'Ctrl+Tab',
  cyclePrevWorkspace: 'Ctrl+Shift+Tab',
  openShortcuts: 'Ctrl+/',
  openTemplates: 'Ctrl+T',
  openSettings: 'Ctrl+,',
  quickSwitcher: 'Ctrl+K',
};

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
