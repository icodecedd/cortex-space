import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DEFAULT_PRESETS } from "@/lib/setup-constants";

export function usePresets(rootPath: string, isValidDir: boolean | null) {
  const [presets, setPresets] = useState<{label: string, path: string}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("cortex_presets");
    if (saved) {
      setPresets(JSON.parse(saved));
    } else {
      setPresets(DEFAULT_PRESETS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cortex_presets", JSON.stringify(presets));
  }, [presets]);

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
