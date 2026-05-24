import { useState, useMemo, useEffect } from "react";
import { LayoutType, AGENT_PRESETS, PaneConfig } from "@/lib/setup-constants";
import { getPaneCount } from "@/lib/setup-utils";
import { getSetting, setSetting } from "@/lib/store";

export function useSetupPanes(mode: 'normal' | 'agents') {
  const [layout, setLayout] = useState<LayoutType>("2x2");
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    async function init() {
      const saved = await getSetting<LayoutType>("cortex_layout", "2x2");
      setLayout(saved);
      setIsInitialized(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_layout", layout);
    }
  }, [layout, isInitialized]);

  const [panes, setPanes] = useState<PaneConfig[]>([
    { id: 1, name: "Pane 1", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
    { id: 2, name: "Pane 2", command: mode === 'agents' ? AGENT_PRESETS[1].command : "", isCustom: false },
    { id: 3, name: "Pane 3", command: mode === 'agents' ? AGENT_PRESETS[2].command : "", isCustom: false },
    { id: 4, name: "Pane 4", command: mode === 'agents' ? AGENT_PRESETS[3].command : "", isCustom: false },
    { id: 5, name: "Pane 5", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
    { id: 6, name: "Pane 6", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
    { id: 7, name: "Pane 7", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
    { id: 8, name: "Pane 8", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
    { id: 9, name: "Pane 9", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
  ]);

  const paneCount = useMemo(() => getPaneCount(layout), [layout]);
  const activePanes = useMemo(() => panes.slice(0, paneCount), [panes, paneCount]);

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout);
    const count = getPaneCount(newLayout);
    
    if (panes.length < count) {
      const extra = Array.from({ length: count - panes.length }, (_, i) => ({
        id: panes.length + i + 1,
        name: `Pane ${panes.length + i + 1}`,
        command: mode === 'agents' ? AGENT_PRESETS[0].command : "",
        isCustom: false
      }));
      setPanes(prev => [...prev, ...extra]);
    }
  };

  const updatePaneCommand = (id: number, command: string, isCustom?: boolean) => {
    setPanes(prev => prev.map(p => 
      p.id === id 
        ? { ...p, command, isCustom: isCustom !== undefined ? isCustom : p.isCustom } 
        : p
    ));
  };

  return {
    layout,
    setLayout,
    panes,
    setPanes,
    activePanes,
    handleLayoutChange,
    updatePaneCommand
  };
}
