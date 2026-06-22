import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { DEFAULT_PRESETS } from "@/lib/setup-constants";
import { getSetting, setSetting } from "@/lib/store";
import { DirectoryPreset } from "@/lib";

export function usePresets(rootPath: string, isValidDir: boolean | null) {
  const [presets, setPresets] = useState<DirectoryPreset[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastAddRef = useRef(0);

  useEffect(() => {
    async function init() {
      const saved = await getSetting<DirectoryPreset[]>(
        "cortex_presets",
        DEFAULT_PRESETS,
      );
      // Ensure all saved presets have IDs (migration for old data)
      const sanitized = saved.map((p) => ({
        ...p,
        id: p.id || crypto.randomUUID(),
      }));
      setPresets(sanitized);
      setIsInitialized(true);
    }
    init();

    const handleSync = () => init();
    window.addEventListener("cortex:assets-updated", handleSync);
    return () =>
      window.removeEventListener("cortex:assets-updated", handleSync);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_presets", presets);
    }
  }, [presets, isInitialized]);

  // Helper to normalize path for comparison
  const normalizePath = (p: string) => {
    if (!p) return "";
    // Remove trailing slashes, replace forward with backslash, and lowercase
    return p
      .replace(/[\\/]+$/, "")
      .replace(/\//g, "\\")
      .toLowerCase()
      .trim();
  };

  const addPreset = useCallback(() => {
    const targetPath = rootPath;
    if (!targetPath) return;

    const now = Date.now();
    if (now - lastAddRef.current < 400) return;
    lastAddRef.current = now;

    if (isValidDir === false) {
      toast.error("Failed to save preset", {
        id: "preset-invalid",
        description: "The directory must exist before saving as a preset.",
      });
      return;
    }

    const normalizedTarget = normalizePath(targetPath);
    const name =
      targetPath.split(/[\\/]/).filter(Boolean).pop() || "NEW PRESET";

    setPresets((prev) => {
      const isDuplicate = prev.some(
        (p) => normalizePath(p.path) === normalizedTarget,
      );

      if (isDuplicate) {
        toast.error("Preset cannot be added", {
          id: `preset-dup-${normalizedTarget}`,
          description: "This directory is already in your presets list.",
        });
        return prev;
      }

      const newPreset: DirectoryPreset = {
        id: crypto.randomUUID(),
        label: name.toUpperCase(),
        path: targetPath,
      };

      toast.success(`${name.toUpperCase()} saved successfully`, {
        id: `preset-save-${normalizedTarget}`,
        description: "The directory has been added to your presets.",
      });

      return [...prev, newPreset];
    });
  }, [rootPath, isValidDir]);

  const removePreset = useCallback((path: string) => {
    setPresets((prev) => {
      const presetToRemove = prev.find((p) => p.path === path);
      if (!presetToRemove) return prev;

      toast.info(`${presetToRemove.label} removed successfully`, {
        id: `preset-del-${path}`,
        description: "The preset has been deleted from your library.",
        action: {
          label: "Undo",
          onClick: () => setPresets((old) => [...old, presetToRemove]),
        },
        cancel: {
          label: "Dismiss",
          onClick: () => {},
        },
      });

      return prev.filter((p) => p.path !== path);
    });
  }, []);

  return {
    presets,
    setPresets,
    addPreset,
    removePreset,
  };
}
