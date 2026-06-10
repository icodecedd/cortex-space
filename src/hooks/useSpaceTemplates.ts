import { useState, useEffect, useCallback, useRef } from "react";
import { getSetting, setSetting } from "@/lib/store";
import { SpaceTemplate, LayoutNode, Mode } from "@/types";
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
      toast.error("Workspace cannot be added", {
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
    toast.success(`${name} saved successfully`, {
      id: `tpl-save-${normalizedTarget}`,
      description: "The workspace has been added to your library.",
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    const template = templatesRef.current.find(t => t.id === id);
    const name = template?.name || "Template";
    
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success(`${name} permanently deleted`, { 
      id: `tpl-del-${id}`,
      description: "The workspace has been permanently removed."
    });
  }, []);

  const archiveTemplate = useCallback((id: string) => {
    const template = templatesRef.current.find(t => t.id === id);
    const name = template?.name || "Template";
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isArchived: true } : t));
    toast.info(`${name} archived`, {
      id: `tpl-arch-${id}`,
      description: "The workspace has been archived and can be restored later."
    });
  }, []);

  const archiveTemplates = useCallback((ids: string[]) => {
    const count = ids.length;
    setTemplates(prev => prev.map(t => ids.includes(t.id) ? { ...t, isArchived: true } : t));
    toast.info(`${count} workspaces archived`, {
      id: `tpl-arch-bulk-${ids.join('-').substring(0, 50)}`,
      description: "The items have been archived and can be restored later."
    });
  }, []);

  const unarchiveTemplate = useCallback((id: string) => {
    const template = templatesRef.current.find(t => t.id === id);
    const name = template?.name || "Template";
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isArchived: false } : t));
    toast.success(`${name} restored`, {
      id: `tpl-unarch-${id}`,
      description: "The workspace has been restored to your library."
    });
  }, []);

  const unarchiveTemplates = useCallback((ids: string[]) => {
    const count = ids.length;
    setTemplates(prev => prev.map(t => ids.includes(t.id) ? { ...t, isArchived: false } : t));
    toast.success(`${count} workspaces restored`, {
      id: `tpl-unarch-bulk-${ids.join('-').substring(0, 50)}`,
      description: `Successfully restored ${count} items to your library.`
    });
  }, []);

  const permanentlyDeleteTemplate = useCallback((id: string) => {
    const template = templatesRef.current.find(t => t.id === id);
    const name = template?.name || "Template";
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success(`${name} permanently deleted`, {
      id: `tpl-perm-${id}`,
      description: "The workspace has been permanently removed."
    });
  }, []);

  const deleteTemplates = useCallback((ids: string[]) => {
    const count = ids.length;
    setTemplates(prev => prev.filter(t => !ids.includes(t.id)));
    toast.success(`${count} workspaces permanently deleted`, {
      id: `tpl-del-bulk-${ids.join('-').substring(0, 50)}`,
      description: `Successfully removed ${count} items from your library.`
    });
  }, []);

  return {
    templates,
    captureCurrent,
    deleteTemplate,
    deleteTemplates,
    archiveTemplate,
    archiveTemplates,
    unarchiveTemplate,
    unarchiveTemplates,
    permanentlyDeleteTemplate
  };
}
