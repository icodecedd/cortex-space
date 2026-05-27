import { useState, useEffect, useCallback } from 'react';
import {
  setSetting,
  setSettingsGroup,
  getSettingsGroup,
  DEMO_DEFAULTS,
  DemoSettings,
} from '@/lib/store';

const PREFIX = 'demo';

export function useDemoSettings() {
  const [settings, setSettings] = useState<DemoSettings>(DEMO_DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from store on mount
  useEffect(() => {
    getSettingsGroup<DemoSettings>(PREFIX, DEMO_DEFAULTS).then((saved) => {
      setSettings(saved);
      setIsLoaded(true);
    });
  }, []);

  const setDemoSetting = useCallback(async <K extends keyof DemoSettings>(
    key: K,
    value: DemoSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await setSetting(`${PREFIX}.${String(key)}`, value);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('cortex-demo-settings-changed', {
        detail: { [key]: value }
    }));
  }, []);

  const resetToDefaults = useCallback(async () => {
    setSettings(DEMO_DEFAULTS);
    await setSettingsGroup<DemoSettings>(PREFIX, DEMO_DEFAULTS);
    window.dispatchEvent(new CustomEvent('cortex-demo-settings-changed', {
        detail: DEMO_DEFAULTS
    }));
  }, []);

  return { settings, isLoaded, setDemoSetting, resetToDefaults };
}
