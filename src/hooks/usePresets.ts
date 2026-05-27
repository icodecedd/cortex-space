import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DEFAULT_PRESETS } from "@/lib/setup-constants";
import { getSetting, setSetting } from "@/lib/store";

export function usePresets(rootPath: string, isValidDir: boolean | null) {
  const [presets, setPresets] = useState<{label: string, path: string}[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      const saved = await getSetting("cortex_presets", DEFAULT_PRESETS);
      setPresets(saved);
      setIsInitialized(true);
    }
    init();

    const handleSync = () => init();
    window.addEventListener('cortex:assets-updated', handleSync);
    return () => window.removeEventListener('cortex:assets-updated', handleSync);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_presets", presets);
    }
  }, [presets, isInitialized]);

  const addPreset = () => {
    if (!rootPath) return;
    
    if (isValidDir === false) {
      toast.error("Invalid Directory", {
        description: "Cannot save a preset for a directory that does not exist.",
      });
      return;
    }

    const name = rootPath.split(/[\\/]/).filter(Boolean).pop() || "NEW PRESET";
    if (presets.some(p => p.path === rootPath)) {
      toast.error("Preset already exists", {
        description: "This directory is already in your presets list.",
      });
      return;
    }
    const newPreset = { label: name.toUpperCase(), path: rootPath };
    setPresets([...presets, newPreset]);
    toast.success("Preset saved", {
      description: `${name.toUpperCase()} has been added to your presets.`,
    });
  };

  const removePreset = (path: string) => {
    const presetToRemove = presets.find(p => p.path === path);
    if (!presetToRemove) return;

    setPresets(presets.filter(p => p.path !== path));

    toast.info("Preset removed", {
      description: `${presetToRemove.label} has been deleted.`,
      action: {
        label: "Undo",
        onClick: () => setPresets(prev => [...prev, presetToRemove])
      },
    });
  };

  return {
    presets,
    setPresets,
    addPreset,
    removePreset
  };
}
