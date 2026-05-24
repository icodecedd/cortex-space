import { useState, useEffect, useCallback } from "react";
import { getSetting, setSetting } from "@/lib/store";
import { SpaceTemplate, LayoutNode, PaneNode, Mode } from "@/types";
import { toast } from "sonner";
import { LayoutType, PaneConfig } from "@/lib/setup-constants";

export function useSpaceTemplates() {
  const [templates, setTemplates] = useState<SpaceTemplate[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function loadTemplates() {
      const saved = await getSetting<SpaceTemplate[]>("cortex_templates", []);
      setTemplates(saved);
      setIsInitialized(true);
    }
    loadTemplates();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_templates", templates);
    }
  }, [templates, isInitialized]);

  const captureCurrent = useCallback((
    name: string,
    rootPath: string,
    layout: LayoutType,
    panes: PaneConfig[],
    mode: Mode,
    description?: string
  ) => {
    const layoutNode = convertGridLayoutToTree(layout, panes);
    
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
    toast.success("Template Captured", {
      description: `"${name}" has been saved to your library.`,
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.info("Template Deleted");
  }, []);

  return {
    templates,
    captureCurrent,
    deleteTemplate
  };
}

// Utility to convert the current rigid grid system to the flexible tree system
function convertGridLayoutToTree(layout: LayoutType, panes: PaneConfig[]): LayoutNode {
  const paneNodes: PaneNode[] = panes.map(p => ({
    type: 'pane',
    id: p.id.toString(),
    name: p.name,
    command: p.command,
  }));

  switch (layout) {
    case '1x1':
      return paneNodes[0];
    case '1x2': // 1 row, 2 cols -> vertical split
      return {
        type: 'split',
        direction: 'horizontal', // 'horizontal' split means children are side-by-side (vertical divider)
        ratio: 0.5,
        children: [paneNodes[0], paneNodes[1]]
      };
    case '2x1': // 2 rows, 1 col -> horizontal divider
      return {
        type: 'split',
        direction: 'vertical',
        ratio: 0.5,
        children: [paneNodes[0], paneNodes[1]]
      };
    case '2x2':
      return {
        type: 'split',
        direction: 'vertical',
        ratio: 0.5,
        children: [
          {
            type: 'split',
            direction: 'horizontal',
            ratio: 0.5,
            children: [paneNodes[0], paneNodes[1]]
          },
          {
            type: 'split',
            direction: 'horizontal',
            ratio: 0.5,
            children: [paneNodes[2], paneNodes[3]]
          }
        ]
      };
    case '3x3':
      // Simplified 3x3 tree representation
      return {
        type: 'split',
        direction: 'vertical',
        ratio: 0.33,
        children: [
           {
            type: 'split',
            direction: 'horizontal',
            ratio: 0.33,
            children: [paneNodes[0], { type: 'split', direction: 'horizontal', ratio: 0.5, children: [paneNodes[1], paneNodes[2]] }]
          },
          {
            type: 'split',
            direction: 'vertical',
            ratio: 0.5,
            children: [
               {
                type: 'split',
                direction: 'horizontal',
                ratio: 0.33,
                children: [paneNodes[3], { type: 'split', direction: 'horizontal', ratio: 0.5, children: [paneNodes[4], paneNodes[5]] }]
              },
               {
                type: 'split',
                direction: 'horizontal',
                ratio: 0.33,
                children: [paneNodes[6], { type: 'split', direction: 'horizontal', ratio: 0.5, children: [paneNodes[7], paneNodes[8]] }]
              }
            ]
          }
        ]
      };
    default:
      return paneNodes[0];
  }
}
