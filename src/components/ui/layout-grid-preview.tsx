import React from "react";
import { LayoutConfig } from "@/lib/setup-constants";
import { configToLayoutNode, getPaneCount } from "@/lib/setup-utils";
import { cn } from "@/lib/utils";
import { LayoutNode, SplitNode } from "@/types";

interface LayoutGridPreviewProps {
  config?: LayoutConfig;
  layoutNode?: LayoutNode;
  isActive?: boolean;
  className?: string;
}

export function LayoutGridPreview({ config, layoutNode, isActive, className }: LayoutGridPreviewProps) {
  // Generate mock panes to construct the layout node if config is passed
  const node = React.useMemo(() => {
    if (layoutNode) return layoutNode;
    if (!config) return null;
    const count = getPaneCount(config);
    const mockPanes = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Pane ${i + 1}`,
      command: "",
      isCustom: false
    }));
    return configToLayoutNode(config, mockPanes);
  }, [config, layoutNode]);

  const renderNode = (n: LayoutNode, isRoot: boolean = false): React.ReactNode => {
    if (!n) return null;
    if (n.type === "pane") {
      return (
        <div
          className={cn(
            "flex-1 border-[0.5px] transition-all duration-300",
            isActive
              ? "bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 shadow-[inset_0_0_8px_rgba(var(--accent-primary-rgb),0.1)]"
              : "bg-neutral-900/80 border-neutral-800 group-hover:border-neutral-700/50 group-hover:bg-neutral-800/20",
            isRoot && "rounded-sm"
          )}
        />
      );
    }

    const { direction, ratio, children } = n as SplitNode;

    return (
      <div
        className={cn(
          "flex flex-1 gap-[1px]",
          direction === "vertical" ? "flex-col" : "flex-row"
        )}
      >
        <div style={{ flex: ratio }} className="flex flex-1">
          {renderNode(children[0])}
        </div>
        <div style={{ flex: 1 - ratio }} className="flex flex-1">
          {renderNode(children[1])}
        </div>
      </div>
    );
  };

  if (!node) return null;

  return (
    <div
      className={cn(
        "flex rounded-[4px] overflow-hidden transition-all duration-300",
        className
      )}
    >
      {renderNode(node, true)}
    </div>
  );
}
