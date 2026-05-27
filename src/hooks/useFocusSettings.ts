import { useState, useEffect, useCallback } from 'react';
import {
  setSetting,
  setSettingsGroup,
  getSettingsGroup,
  FOCUS_DEFAULTS,
  FocusSettings,
} from '@/lib/store';

const PREFIX = 'focus';

export function useFocusSettings() {
  const [settings, setSettings] = useState<FocusSettings>(FOCUS_DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from store on mount
  useEffect(() => {
    getSettingsGroup<FocusSettings>(PREFIX, FOCUS_DEFAULTS).then((saved) => {
      setSettings(saved);
      setIsLoaded(true);
    });
  }, []);

  const setFocusSetting = useCallback(async <K extends keyof FocusSettings>(
    key: K,
    value: FocusSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await setSetting(`${PREFIX}.${String(key)}`, value);
  }, []);

  const toggleZenMode = useCallback(async () => {
    const nextVal = !settings.isZenMode;
    setSettings((prev) => ({ ...prev, isZenMode: nextVal }));
    await setSetting(`${PREFIX}.isZenMode`, nextVal);
    return nextVal;
  }, [settings.isZenMode]);

  const resetToDefaults = useCallback(async () => {
    setSettings(FOCUS_DEFAULTS);
    await setSettingsGroup<FocusSettings>(PREFIX, FOCUS_DEFAULTS);
  }, []);

  return { settings, isLoaded, setFocusSetting, toggleZenMode, resetToDefaults };
}
