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

// Shared global state to keep all hook instances in sync
let globalSettings: AppearanceSettings = APPEARANCE_DEFAULTS;
let globalResolvedScheme: 'light' | 'dark' = 'dark';
let isInitialLoaded = false;
const listeners = new Set<(settings: AppearanceSettings, resolved: 'light' | 'dark') => void>();

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyColorScheme(scheme: ColorScheme) {
  if (typeof document === 'undefined') return scheme === 'light' ? 'light' : 'dark';
  const html = document.documentElement;
  const resolved = scheme === 'system' ? getSystemPreference() : scheme;
  
  html.setAttribute('data-color-scheme', resolved);
  if (resolved === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  return resolved;
}

function applyFontScale(scale: number) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--ui-font-scale', String(scale / 100));
}

function notifyListeners() {
  listeners.forEach(listener => listener(globalSettings, globalResolvedScheme));
}

export function useColorScheme() {
  const [settings, setSettings] = useState<AppearanceSettings>(globalSettings);
  const [resolvedScheme, setResolvedScheme] = useState<'light' | 'dark'>(globalResolvedScheme);
  const [isLoaded, setIsLoaded] = useState(isInitialLoaded);

  // Register listener and handle initial load
  useEffect(() => {
    const listener = (newSettings: AppearanceSettings, newResolved: 'light' | 'dark') => {
      setSettings(newSettings);
      setResolvedScheme(newResolved);
      setIsLoaded(true);
    };

    listeners.add(listener);

    if (!isInitialLoaded) {
      getSettingsGroup<AppearanceSettings>(PREFIX, APPEARANCE_DEFAULTS).then((saved) => {
        globalSettings = saved;
        globalResolvedScheme = applyColorScheme(saved.colorScheme);
        applyFontScale(saved.uiFontScale);
        isInitialLoaded = true;
        setIsLoaded(true);
        notifyListeners();
      });
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Media query listener for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (globalSettings.colorScheme === 'system') {
        const resolved = applyColorScheme('system');
        globalResolvedScheme = resolved;
        notifyListeners();
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    globalSettings = { ...globalSettings, colorScheme: scheme };
    globalResolvedScheme = applyColorScheme(scheme);
    notifyListeners();
    await setSetting(`${PREFIX}.colorScheme`, scheme);
  }, []);

  const setUiFontScale = useCallback(async (scale: number) => {
    globalSettings = { ...globalSettings, uiFontScale: scale };
    applyFontScale(scale);
    notifyListeners();
    await setSetting(`${PREFIX}.uiFontScale`, scale);
  }, []);

  const setZenPadding = useCallback(async (padding: number) => {
    globalSettings = { ...globalSettings, zenPadding: padding };
    notifyListeners();
    await setSetting(`${PREFIX}.zenPadding`, padding);
  }, []);

  const setReducedMotion = useCallback(async (reduced: boolean) => {
    globalSettings = { ...globalSettings, reducedMotion: reduced };
    notifyListeners();
    await setSetting(`${PREFIX}.reducedMotion`, reduced);
  }, []);

  const setShimmerPreset = useCallback(async (preset: string) => {
    globalSettings = { ...globalSettings, shimmerPreset: preset };
    notifyListeners();
    await setSetting(`${PREFIX}.shimmerPreset`, preset);
  }, []);

  const setShimmerDuration = useCallback(async (duration: number) => {
    globalSettings = { ...globalSettings, shimmerDuration: duration };
    notifyListeners();
    await setSetting(`${PREFIX}.shimmerDuration`, duration);
  }, []);

  const resetToDefaults = useCallback(async () => {
    globalSettings = APPEARANCE_DEFAULTS;
    globalResolvedScheme = applyColorScheme(APPEARANCE_DEFAULTS.colorScheme);
    applyFontScale(APPEARANCE_DEFAULTS.uiFontScale);
    notifyListeners();
    await setSettingsGroup<AppearanceSettings>(PREFIX, APPEARANCE_DEFAULTS);
  }, []);

  return { settings, resolvedScheme, isLoaded, setColorScheme, setUiFontScale, setZenPadding, setReducedMotion, setShimmerPreset, setShimmerDuration, resetToDefaults };
}
