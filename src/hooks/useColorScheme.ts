import { useState, useEffect, useCallback } from 'react';
import {
  setSetting,
  setSettingsGroup,
  getSettingsGroup,
  APPEARANCE_DEFAULTS,
  AppearanceSettings,
  ColorScheme,
} from '@/lib/store';

const PREFIX = 'appearance';

function applyColorScheme(scheme: ColorScheme) {
  const html = document.documentElement;
  if (scheme === 'dark') {
    html.setAttribute('data-color-scheme', 'dark');
  } else if (scheme === 'light') {
    html.setAttribute('data-color-scheme', 'light');
  } else {
    // system — derive from OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-color-scheme', prefersDark ? 'dark' : 'light');
  }
}

function applyFontScale(scale: number) {
  // scale is 80–150 representing percentage
  document.documentElement.style.setProperty('--ui-font-scale', String(scale / 100));
}

export function useColorScheme() {
  const [settings, setSettings] = useState<AppearanceSettings>(APPEARANCE_DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Media query listener for system theme
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.colorScheme === 'system') {
        applyColorScheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.colorScheme]);

  // Load from store on mount
  useEffect(() => {
    getSettingsGroup<AppearanceSettings>(PREFIX, APPEARANCE_DEFAULTS).then((saved) => {
      setSettings(saved);
      applyColorScheme(saved.colorScheme);
      applyFontScale(saved.uiFontScale);
      setIsLoaded(true);
    });
  }, []);

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    setSettings((prev) => ({ ...prev, colorScheme: scheme }));
    applyColorScheme(scheme);
    await setSetting(`${PREFIX}.colorScheme`, scheme);
  }, []);

  const setUiFontScale = useCallback(async (scale: number) => {
    setSettings((prev) => ({ ...prev, uiFontScale: scale }));
    applyFontScale(scale);
    await setSetting(`${PREFIX}.uiFontScale`, scale);
  }, []);

  const setZenPadding = useCallback(async (padding: number) => {
    setSettings((prev) => ({ ...prev, zenPadding: padding }));
    await setSetting(`${PREFIX}.zenPadding`, padding);
  }, []);

  const setReducedMotion = useCallback(async (reduced: boolean) => {
    setSettings((prev) => ({ ...prev, reducedMotion: reduced }));
    await setSetting(`${PREFIX}.reducedMotion`, reduced);
  }, []);

  const resetToDefaults = useCallback(async () => {
    setSettings(APPEARANCE_DEFAULTS);
    applyColorScheme(APPEARANCE_DEFAULTS.colorScheme);
    applyFontScale(APPEARANCE_DEFAULTS.uiFontScale);
    await setSettingsGroup<AppearanceSettings>(PREFIX, APPEARANCE_DEFAULTS);
  }, []);

  return { settings, isLoaded, setColorScheme, setUiFontScale, setZenPadding, setReducedMotion, resetToDefaults };
}
