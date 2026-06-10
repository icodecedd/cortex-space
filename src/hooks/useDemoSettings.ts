import { useState, useEffect, useCallback } from 'react';
import {
  setSetting,
  setSettingsGroup,
  getSettingsGroup,
  DEMO_DEFAULTS,
  DemoSettings,
} from '@/lib/store';

const PREFIX = 'demo';

// Shared global state to keep all hook instances in sync
let globalSettings: DemoSettings = DEMO_DEFAULTS;
let isInitialLoaded = false;
const listeners = new Set<(settings: DemoSettings) => void>();

function notifyListeners() {
  listeners.forEach(listener => listener(globalSettings));
}

export function useDemoSettings() {
  const [settings, setSettings] = useState<DemoSettings>(globalSettings);
  const [isLoaded, setIsLoaded] = useState(isInitialLoaded);

  // Load from store on mount
  useEffect(() => {
    const listener = (newSettings: DemoSettings) => {
      setSettings(newSettings);
      setIsLoaded(true);
    };

    listeners.add(listener);

    if (!isInitialLoaded) {
      getSettingsGroup<DemoSettings>(PREFIX, DEMO_DEFAULTS).then((saved) => {
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

  const setDemoSetting = useCallback(async <K extends keyof DemoSettings>(
    key: K,
    value: DemoSettings[K]
  ) => {
    globalSettings = { ...globalSettings, [key]: value };
    notifyListeners();
    await setSetting(`${PREFIX}.${String(key)}`, value);
    
    // Dispatch event to notify other components (e.g. non-React parts or those listening to window events)
    window.dispatchEvent(new CustomEvent('cortex-demo-settings-changed', {
        detail: { [key]: value }
    }));
  }, []);

  const resetToDefaults = useCallback(async () => {
    globalSettings = DEMO_DEFAULTS;
    notifyListeners();
    await setSettingsGroup<DemoSettings>(PREFIX, DEMO_DEFAULTS);
    window.dispatchEvent(new CustomEvent('cortex-demo-settings-changed', {
        detail: DEMO_DEFAULTS
    }));
  }, []);

  return { settings, isLoaded, setDemoSetting, resetToDefaults };
}
