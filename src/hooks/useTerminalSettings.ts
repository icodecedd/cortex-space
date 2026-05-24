import { useState, useEffect, useCallback } from 'react';
import {
  getSetting,
  setSettingsGroup,
  getSettingsGroup,
  TERMINAL_DEFAULTS,
  TerminalSettings,
} from '@/lib/store';

const PREFIX = 'terminal';

function applyTerminalCSSVars(settings: TerminalSettings) {
  const root = document.documentElement;
  root.style.setProperty('--terminal-font-size', String(settings.fontSize));
  // Construct full CSS font-family string from plain name
  const cssFontFamily = `"${settings.fontFamily}", monospace`;
  root.style.setProperty('--terminal-font-family', cssFontFamily);
  root.style.setProperty('--terminal-line-height', String(settings.lineHeight));
  root.style.setProperty('--terminal-letter-spacing', `${settings.letterSpacing}px`);
}

function dispatchSettingsEvent(settings: TerminalSettings) {
  window.dispatchEvent(
    new CustomEvent('cortex-settings-changed', { detail: { terminal: settings } })
  );
}

export function useTerminalSettings() {
  const [settings, setSettings] = useState<TerminalSettings>(TERMINAL_DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from store on mount
  useEffect(() => {
    getSettingsGroup<TerminalSettings>(PREFIX, TERMINAL_DEFAULTS).then((saved) => {
      setSettings(saved);
      applyTerminalCSSVars(saved);
      setIsLoaded(true);
    });
  }, []);

  /**
   * Update a single field — applies CSS vars + dispatches event + saves to store.
   * Safe to call on every slider drag (CSS + event dispatch is cheap),
   * but store.set is also called here. For high-frequency sliders, use
   * updateSettingLive() for intermediate changes and commitSetting() on release.
   */
  const updateSetting = useCallback(
    async <K extends keyof TerminalSettings>(key: K, value: TerminalSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        applyTerminalCSSVars(next);
        dispatchSettingsEvent(next);
        return next;
      });
      await getSetting(`${PREFIX}.${String(key)}`, value); // ensure store is init
      await setSettingsGroup<TerminalSettings>(PREFIX, { [key]: value } as Partial<TerminalSettings>);
    },
    []
  );

  /**
   * Live-update (CSS + event only, no store write) — use during slider drag.
   */
  const updateSettingLive = useCallback(
    <K extends keyof TerminalSettings>(key: K, value: TerminalSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        applyTerminalCSSVars(next);
        dispatchSettingsEvent(next);
        return next;
      });
    },
    []
  );

  /**
   * Commit the current in-memory state to the store (call on slider commit/blur).
   */
  const commitSettings = useCallback(async (patch?: Partial<TerminalSettings>) => {
    setSettings((prev) => {
      const next = patch ? { ...prev, ...patch } : prev;
      setSettingsGroup<TerminalSettings>(PREFIX, next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(async () => {
    setSettings(TERMINAL_DEFAULTS);
    applyTerminalCSSVars(TERMINAL_DEFAULTS);
    dispatchSettingsEvent(TERMINAL_DEFAULTS);
    await setSettingsGroup<TerminalSettings>(PREFIX, TERMINAL_DEFAULTS);
  }, []);

  return { settings, isLoaded, updateSetting, updateSettingLive, commitSettings, resetToDefaults };
}
