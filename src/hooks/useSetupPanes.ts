import { useState, useMemo, useEffect, useCallback } from "react";
import { LayoutType, LayoutConfig, SavedLayout, INITIAL_LAYOUTS, PaneConfig } from "@/lib/setup-constants";
import { getPaneCount, derivePaneName } from "@/lib/setup-utils";
import { getSetting, setSetting, SemanticsSettings, SEMANTICS_DEFAULTS } from "@/lib/store";
import { toast } from "sonner";
import { Agent } from "@/types";

export function useSetupPanes(agents: Agent[] = []) {
  const [layoutType, setLayoutType] = useState<LayoutType>("2x2");
  const [customLayout, setCustomLayout] = useState<LayoutConfig>({ type: 'grid', rows: 2, cols: 2 });
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>(INITIAL_LAYOUTS);
  const [semantics, setSemantics] = useState<SemanticsSettings>(SEMANTICS_DEFAULTS);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const migrateLayout = (l: any): LayoutConfig => {
    if (l && l.type) return l as LayoutConfig;
    // Migrate old { rows, cols } structure
    if (l && typeof l.rows === 'number' && typeof l.cols === 'number') {
      return { type: 'grid', rows: l.rows, cols: l.cols };
    }
    return { type: 'grid', rows: 2, cols: 2 };
  };

  const currentLayout = useMemo((): LayoutConfig => {
    if (layoutType === 'custom') return migrateLayout(customLayout);
    const saved = savedLayouts.find(l => l.id === layoutType);
    if (saved) {
      if (saved.config) return migrateLayout(saved.config);
      // Saved layout itself might be the old structure
      return migrateLayout(saved);
    }
    // Fallback
    const firstSaved = savedLayouts[0];
    if (firstSaved) return migrateLayout(firstSaved.config || firstSaved);
    return { type: 'grid', rows: 2, cols: 2 };
  }, [layoutType, customLayout, savedLayouts]);

  useEffect(() => {
    async function init() {
      const savedType = await getSetting<LayoutType>("cortex_layout_type", "2x2");
      const savedCustomRaw = await getSetting<any>("cortex_layout_custom", { type: 'grid', rows: 2, cols: 2 });
      const savedListRaw = await getSetting<any[]>("cortex_saved_layouts", INITIAL_LAYOUTS);
      
      const savedTools = await getSetting<Record<string, string>>("semantics.tools", SEMANTICS_DEFAULTS.tools);
      const savedPatterns = await getSetting<any[]>("semantics.patterns", SEMANTICS_DEFAULTS.patterns);

      // Migrate custom layout
      let migratedCustom = migrateLayout(savedCustomRaw);

      const savedLayoutMode = await getSetting<"grid" | "count">("focus.customLayoutMode", "grid");
      if (migratedCustom.type !== savedLayoutMode) {
        if (savedLayoutMode === 'grid') {
          const count = (migratedCustom as any).value || 4;
          const cols = Math.ceil(Math.sqrt(count));
          const rows = Math.ceil(count / cols);
          migratedCustom = { type: 'grid', rows, cols };
        } else {
          const value = ((migratedCustom as any).rows || 2) * ((migratedCustom as any).cols || 2);
          migratedCustom = { type: 'count', value };
        }
      }

      // Migrate saved list
      const migratedList = savedListRaw.map(l => {
        if (l.config) return { ...l, config: migrateLayout(l.config) };
        // Old structure where SavedLayout extended LayoutConfig
        const config = migrateLayout(l);
        return {
          id: l.id || `layout-${Date.now()}-${Math.random()}`,
          name: l.name || `${config.type === 'grid' ? `${config.rows}X${config.cols}` : 'Custom'}`,
          config
        };
      });

      setLayoutType(savedType);
      setCustomLayout(migratedCustom);
      setSavedLayouts(migratedList);
      setSemantics({ tools: savedTools, patterns: savedPatterns });
      setIsInitialized(true);
    }
    init();

    // Listen for updates from other components
    const handleSync = () => init();
    window.addEventListener('cortex:assets-updated', handleSync);
    window.addEventListener('cortex-settings-changed', handleSync);
    return () => {
      window.removeEventListener('cortex:assets-updated', handleSync);
      window.removeEventListener('cortex-settings-changed', handleSync);
    };
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
    setCustomLayout(prev => {
      // If we're switching types, we need to provide a full valid object
      if (config.type && config.type !== prev.type) {
        if (config.type === 'grid') {
          return { type: 'grid', rows: (config as any).rows || 2, cols: (config as any).cols || 2 };
        } else {
          return { type: 'count', value: (config as any).value || 4 };
        }
      }
      // Otherwise, we can merge safely as we're staying within the same variant
      return { ...prev, ...config } as LayoutConfig;
    });
    setLayoutType('custom');
  };

  const addSavedLayout = (name: string, config: LayoutConfig) => {
    // Validation: Check for duplicate configuration
    const isDuplicate = savedLayouts.some(l => {
      if (l.config.type !== config.type) return false;
      if (config.type === 'grid' && l.config.type === 'grid') {
        return l.config.rows === config.rows && l.config.cols === config.cols;
      }
      if (config.type === 'count' && l.config.type === 'count') {
        return l.config.value === config.value;
      }
      return false;
    });

    if (isDuplicate) {
      toast.error("Layout cannot be added", {
        description: "This configuration already exists in your library."
      });
      return;
    }

    const newLayout: SavedLayout = {
      id: `layout-${Date.now()}`,
      name,
      config
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
      const name = isDefaultName ? derivePaneName(command, `Pane ${id}`, agents, semantics) : p.name;
      
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
      const name = isDefaultName ? derivePaneName(command, `Pane ${p.id}`, agents, semantics) : p.name;
      return { ...p, command, name, isCustom: newIsCustom };
    }));
  }, [agents, semantics]);

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
