import { useState, useEffect, useCallback, useRef } from "react";
import { getSetting, setSetting } from "@/lib/store";
import { SpaceTemplate, LayoutNode, PaneNode, Mode } from "@/types";
import { toast } from "sonner";
import { LayoutType, PaneConfig, INITIAL_LAYOUTS } from "@/lib/setup-constants";
import { gridToLayoutNode } from "@/lib/setup-utils";

export function useSpaceTemplates() {
  const [templates, setTemplates] = useState<SpaceTemplate[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const templatesRef = useRef<SpaceTemplate[]>([]);
  const lastCaptureRef = useRef(0);

  // Sync ref with state
  useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);

  useEffect(() => {
    async function loadTemplates() {
      const saved = await getSetting<SpaceTemplate[]>("cortex_templates", []);
      setTemplates(saved);
      templatesRef.current = saved;
      setIsInitialized(true);
    }
    loadTemplates();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_templates", templates);
    }
  }, [templates, isInitialized]);

  // Helper to normalize path for comparison
  const normalizePath = (p: string) => {
    if (!p) return "";
    return p.replace(/[\\/]+$/, "").replace(/\//g, "\\").toLowerCase();
  };

  const captureCurrent = useCallback((
    name: string,
    rootPath: string,
    layout: LayoutType | LayoutNode,
    panes: PaneConfig[],
    mode: Mode,
    description?: string
  ) => {
    const now = Date.now();
    if (now - lastCaptureRef.current < 500) return;
    lastCaptureRef.current = now;

    let layoutNode: LayoutNode;
    
    if (typeof layout === 'string') {
      const layoutInfo = INITIAL_LAYOUTS.find(l => l.id === layout);
      if (layoutInfo) {
        layoutNode = gridToLayoutNode(layoutInfo, panes);
      } else {
        // Fallback for custom or unknown strings
        layoutNode = {
          type: 'pane',
          id: panes[0]?.id.toString() || '1',
          name: panes[0]?.name || 'Pane 1',
          command: panes[0]?.command || ''
        };
      }
    } else {
      layoutNode = layout;
    }

    const currentTemplates = templatesRef.current;
    const normalizedTarget = normalizePath(rootPath);
    const layoutStr = JSON.stringify(layoutNode);

    // Validation: Check for duplicates (Same Path + Same Layout + Same Mode)
    const isDuplicate = currentTemplates.some(t => 
      normalizePath(t.rootPath) === normalizedTarget && 
      JSON.stringify(t.layout) === layoutStr &&
      t.mode === mode
    );

    if (isDuplicate) {
      toast.error("Template cannot be added", {
        id: `tpl-dup-${normalizedTarget}`,
        description: "An identical configuration already exists in your library."
      });
      return;
    }
    
    const newTemplate: SpaceTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      rootPath,
      layout: layoutNode,
      mode,
      createdAt: new Date().toISOString(),
    };

    setTemplates(prev => [newTemplate, ...prev]);
    toast.success(`${name} captured successfully`, {
      id: `tpl-save-${normalizedTarget}`,
      description: "The workspace template has been saved.",
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    const template = templatesRef.current.find(t => t.id === id);
    const name = template?.name || "Template";
    
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.info(`${name} removed successfully`, { 
      id: `tpl-del-${id}`,
      description: "The template has been deleted from your library."
    });
  }, []);

  return {
    templates,
    captureCurrent,
    deleteTemplate
  };
}
