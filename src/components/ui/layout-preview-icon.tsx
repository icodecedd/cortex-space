import React from "react";
import { LayoutNode, SplitNode } from "@/types";
import { cn } from "@/lib/utils";

interface LayoutPreviewIconProps {
  layout: LayoutNode;
  className?: string;
}

export function LayoutPreviewIcon({ layout, className }: LayoutPreviewIconProps) {
  const renderNode = (node: LayoutNode, isRoot: boolean = false): React.ReactNode => {
    if (node.type === 'pane') {
      return (
        <div 
          className={cn(
            "flex-1 border-[0.5px] border-[var(--border-color)] bg-[var(--text-primary)]/5",
            isRoot && "rounded-[2px]"
          )}
        />
      );
    }

    const { direction, ratio, children } = node as SplitNode;
    
    return (
      <div 
        className={cn(
          "flex flex-1 gap-[1px]",
          direction === 'vertical' ? "flex-col" : "flex-row"
        )}
      >
        <div style={{ flex: ratio }}>
          {renderNode(children[0])}
        </div>
        <div style={{ flex: 1 - ratio }}>
          {renderNode(children[1])}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-12 h-10 flex border border-[var(--border-color)] rounded-[4px] overflow-hidden p-[1px] bg-[var(--bg-color)]/40", className)}>
      {renderNode(layout, true)}
    </div>
  );
}
