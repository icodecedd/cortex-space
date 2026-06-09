import { useState, useMemo, useEffect, useCallback } from "react";
import { LayoutType, LayoutConfig, SavedLayout, INITIAL_LAYOUTS, PaneConfig } from "@/lib/setup-constants";
import { getPaneCount, derivePaneName } from "@/lib/setup-utils";
import { getSetting, setSetting } from "@/lib/store";
import { toast } from "sonner";
import { Agent } from "@/types";

export function useSetupPanes(agents: Agent[] = []) {
  const [layoutType, setLayoutType] = useState<LayoutType>("2x2");
  const [customLayout, setCustomLayout] = useState<LayoutConfig>({ rows: 2, cols: 2 });
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>(INITIAL_LAYOUTS);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const currentLayout = useMemo(() => {
    if (layoutType === 'custom') return customLayout;
    const saved = savedLayouts.find(l => l.id === layoutType);
    if (saved) return { rows: saved.rows, cols: saved.cols };
    // Fallback to first available or 2x2
    return savedLayouts[0] || { rows: 2, cols: 2 };
  }, [layoutType, customLayout, savedLayouts]);

  useEffect(() => {
    async function init() {
      const savedType = await getSetting<LayoutType>("cortex_layout_type", "2x2");
      const savedCustom = await getSetting<LayoutConfig>("cortex_layout_custom", { rows: 2, cols: 2 });
      const savedList = await getSetting<SavedLayout[]>("cortex_saved_layouts", INITIAL_LAYOUTS);
      
      setLayoutType(savedType);
      setCustomLayout(savedCustom);
      setSavedLayouts(savedList);
      setIsInitialized(true);
    }
    init();

    // Listen for updates from other components (e.g. Cortex Library)
    const handleSync = () => init();
    window.addEventListener('cortex:assets-updated', handleSync);
    return () => window.removeEventListener('cortex:assets-updated', handleSync);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_layout_type", layoutType);
      setSetting("cortex_layout_custom", customLayout);
      setSetting("cortex_saved_layouts", savedLayouts);
    }
  }, [layoutType, customLayout, savedLayouts, isInitialized]);

  const [panes, setPanes] = useState<PaneConfig[]>(() => 
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      name: `Pane ${i + 1}`,
      command: "", // Default to empty so placeholders work correctly
      isCustom: false
    }))
  );

  const paneCount = useMemo(() => getPaneCount(currentLayout), [currentLayout]);
  const activePanes = useMemo(() => panes.slice(0, paneCount), [panes, paneCount]);

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayoutType(newLayout);
  };

  const updateCustomLayout = (config: Partial<LayoutConfig>) => {
    setCustomLayout(prev => ({ ...prev, ...config }));
    setLayoutType('custom');
  };

  const addSavedLayout = (name: string, config: LayoutConfig) => {
    // Validation: Check for duplicate configuration
    const isDuplicate = savedLayouts.some(l => l.rows === config.rows && l.cols === config.cols);
    if (isDuplicate) {
      toast.error("Layout cannot be added", {
        description: "This grid configuration already exists in your library."
      });
      return;
    }

    const newLayout: SavedLayout = {
      id: `layout-${Date.now()}`,
      name,
      rows: config.rows,
      cols: config.cols
    };
    setSavedLayouts(prev => [...prev, newLayout]);
    setLayoutType(newLayout.id);
    toast.success(`${name} registered successfully`, { description: "The layout has been added to your presets." });
  };

  const removeSavedLayout = (id: string) => {
    setSavedLayouts(prev => prev.filter(l => l.id !== id));
    if (layoutType === id) setLayoutType('2x2');
  };

  const restoreDefaults = async () => {
    const existingIds = new Set(savedLayouts.map(l => l.id));
    const toAdd = INITIAL_LAYOUTS.filter(l => !existingIds.has(l.id));
    if (toAdd.length === 0) return;
    
    const updated = [...savedLayouts, ...toAdd];
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
  };

  const updatePaneCommand = (id: number, command: string, isCustom?: boolean) => {
    setPanes(prev => prev.map(p => {
      if (p.id !== id) return p;
      
      const newIsCustom = isCustom !== undefined ? isCustom : p.isCustom;
      // Auto-derive name if it's currently a default one or empty
      const isDefaultName = p.name === `Pane ${p.id}` || p.name === `New Pane` || p.name.trim() === "";
      const name = isDefaultName ? derivePaneName(command, `Pane ${id}`, agents) : p.name;
      
      return { ...p, command, name, isCustom: newIsCustom };
    }));
  };

  const updatePaneName = (id: number, name: string) => {
    setPanes(prev => prev.map(p => 
      p.id === id ? { ...p, name } : p
    ));
  };

  const updateAllPaneCommands = useCallback((command: string, isCustom?: boolean) => {
    setPanes(prev => prev.map(p => {
      const newIsCustom = isCustom !== undefined ? isCustom : p.isCustom;
      const isDefaultName = p.name === `Pane ${p.id}` || p.name === `New Pane` || p.name.trim() === "";
      const name = isDefaultName ? derivePaneName(command, `Pane ${p.id}`, agents) : p.name;
      return { ...p, command, name, isCustom: newIsCustom };
    }));
  }, [agents]);

  return {
    layoutType,
    setLayoutType,
    customLayout,
    setCustomLayout: updateCustomLayout,
    savedLayouts,
    addSavedLayout,
    removeSavedLayout,
    currentLayout,
    panes,
    setPanes,
    activePanes,
    handleLayoutChange,
    updatePaneCommand,
    updatePaneName,
    updateAllPaneCommands,
    restoreDefaults,
    isInitialized
  };
}
