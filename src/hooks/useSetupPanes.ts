import { useState, useMemo, useEffect } from "react";
import { LayoutType, LayoutConfig, SavedLayout, INITIAL_LAYOUTS, AGENT_PRESETS, PaneConfig } from "@/lib/setup-constants";
import { getPaneCount } from "@/lib/setup-utils";
import { getSetting, setSetting } from "@/lib/store";

export function useSetupPanes(mode: 'normal' | 'agents') {
  const [layoutType, setLayoutType] = useState<LayoutType>("2x2");
  const [customLayout, setCustomLayout] = useState<LayoutConfig>({ rows: 2, cols: 2 });
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
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
      command: mode === 'agents' ? AGENT_PRESETS[i % AGENT_PRESETS.length].command : "",
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
    const newLayout: SavedLayout = {
      id: `layout-${Date.now()}`,
      name,
      rows: config.rows,
      cols: config.cols
    };
    setSavedLayouts(prev => [...prev, newLayout]);
    setLayoutType(newLayout.id);
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
    setPanes(prev => prev.map(p => 
      p.id === id 
        ? { ...p, command, isCustom: isCustom !== undefined ? isCustom : p.isCustom } 
        : p
    ));
  };

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
    restoreDefaults
  };
}
