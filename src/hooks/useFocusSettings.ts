import { useState, useEffect, useCallback } from 'react';
import {
  setSetting,
  setSettingsGroup,
  getSettingsGroup,
  FOCUS_DEFAULTS,
  FocusSettings,
} from '@/lib/store';

const PREFIX = 'focus';

// Shared global state to keep all hook instances in sync
let globalSettings: FocusSettings = FOCUS_DEFAULTS;
let isInitialLoaded = false;
const listeners = new Set<(settings: FocusSettings) => void>();

function notifyListeners() {
  listeners.forEach(listener => listener(globalSettings));
}

export function useFocusSettings() {
  const [settings, setSettings] = useState<FocusSettings>(globalSettings);
  const [isLoaded, setIsLoaded] = useState(isInitialLoaded);

  // Register listener and handle initial load
  useEffect(() => {
    const listener = (newSettings: FocusSettings) => {
      setSettings(newSettings);
      setIsLoaded(true);
    };

    listeners.add(listener);

    if (!isInitialLoaded) {
      getSettingsGroup<FocusSettings>(PREFIX, FOCUS_DEFAULTS).then((saved) => {
        globalSettings = saved;
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

  const setFocusSetting = useCallback(async <K extends keyof FocusSettings>(
    key: K,
    value: FocusSettings[K]
  ) => {
    globalSettings = { ...globalSettings, [key]: value };
    notifyListeners();
    await setSetting(`${PREFIX}.${String(key)}`, value);
  }, []);

  const toggleZenMode = useCallback(async () => {
    const nextVal = !globalSettings.isZenMode;
    globalSettings = { ...globalSettings, isZenMode: nextVal };
    notifyListeners();
    await setSetting(`${PREFIX}.isZenMode`, nextVal);
    return nextVal;
  }, []);

  const resetToDefaults = useCallback(async () => {
    globalSettings = FOCUS_DEFAULTS;
    notifyListeners();
    await setSettingsGroup<FocusSettings>(PREFIX, FOCUS_DEFAULTS);
  }, []);

  return { settings, isLoaded, setFocusSetting, toggleZenMode, resetToDefaults };
}
