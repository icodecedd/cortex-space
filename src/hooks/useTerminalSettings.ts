import { useState, useEffect, useCallback } from 'react';
import {
  setSettingsGroup,
  getSettingsGroup,
  TERMINAL_DEFAULTS,
  TerminalSettings,
} from '@/lib/store';

const PREFIX = 'terminal';

// Shared global state to keep all hook instances in sync
let globalSettings: TerminalSettings = TERMINAL_DEFAULTS;
let isInitialLoaded = false;
const listeners = new Set<(settings: TerminalSettings) => void>();

function applyTerminalCSSVars(settings: TerminalSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--terminal-font-size', String(settings.fontSize));
  // Construct full CSS font-family string from plain name
  const cssFontFamily = `"${settings.fontFamily}", monospace`;
  root.style.setProperty('--terminal-font-family', cssFontFamily);
  root.style.setProperty('--terminal-line-height', String(settings.lineHeight));
  root.style.setProperty('--terminal-letter-spacing', `${settings.letterSpacing}px`);
  root.style.setProperty('--terminal-font-weight', String(settings.fontWeight || '400'));
}

function dispatchSettingsEvent(settings: TerminalSettings) {
  window.dispatchEvent(
    new CustomEvent('cortex-settings-changed', { detail: { terminal: settings } })
  );
}

function notifyListeners() {
  listeners.forEach(listener => listener(globalSettings));
}

export function useTerminalSettings() {
  const [settings, setSettings] = useState<TerminalSettings>(globalSettings);
  const [isLoaded, setIsLoaded] = useState(isInitialLoaded);

  // Register listener and handle initial load
  useEffect(() => {
    const listener = (newSettings: TerminalSettings) => {
      setSettings(newSettings);
      setIsLoaded(true);
    };

    listeners.add(listener);

    if (!isInitialLoaded) {
      getSettingsGroup<TerminalSettings>(PREFIX, TERMINAL_DEFAULTS).then((saved) => {
        globalSettings = saved;
        applyTerminalCSSVars(saved);
        isInitialLoaded = true;
        setIsLoaded(true);
        notifyListeners();
      });
    } else {
        setIsLoaded(true);
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  /**
   * Update a single field — applies CSS vars + dispatches event + saves to store.
   */
  const updateSetting = useCallback(
    async <K extends keyof TerminalSettings>(key: K, value: TerminalSettings[K]) => {
      globalSettings = { ...globalSettings, [key]: value };
      applyTerminalCSSVars(globalSettings);
      dispatchSettingsEvent(globalSettings);
      notifyListeners();
      await setSettingsGroup<TerminalSettings>(PREFIX, { [key]: value } as Partial<TerminalSettings>);
    },
    []
  );

  /**
   * Live-update (CSS + event only, no store write) — use during slider drag.
   */
  const updateSettingLive = useCallback(
    <K extends keyof TerminalSettings>(key: K, value: TerminalSettings[K]) => {
      globalSettings = { ...globalSettings, [key]: value };
      applyTerminalCSSVars(globalSettings);
      dispatchSettingsEvent(globalSettings);
      notifyListeners();
    },
    []
  );

  /**
   * Commit the current in-memory state to the store (call on slider commit/blur).
   */
  const commitSettings = useCallback(async (patch?: Partial<TerminalSettings>) => {
    if (patch) {
      globalSettings = { ...globalSettings, ...patch };
      applyTerminalCSSVars(globalSettings);
      dispatchSettingsEvent(globalSettings);
      notifyListeners();
    }
    await setSettingsGroup<TerminalSettings>(PREFIX, globalSettings);
  }, []);

  const resetToDefaults = useCallback(async () => {
    globalSettings = TERMINAL_DEFAULTS;
    applyTerminalCSSVars(TERMINAL_DEFAULTS);
    dispatchSettingsEvent(TERMINAL_DEFAULTS);
    notifyListeners();
    await setSettingsGroup<TerminalSettings>(PREFIX, TERMINAL_DEFAULTS);
  }, []);

  return { settings, isLoaded, updateSetting, updateSettingLive, commitSettings, resetToDefaults };
}
