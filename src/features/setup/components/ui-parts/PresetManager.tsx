import { X, Plus, Database } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import { DirectoryPreset } from "@/types";

interface PresetManagerProps {
  presets: DirectoryPreset[];
  onSelect: (path: string) => void;
  onRemove: (path: string) => void;
  onAdd: () => void;
  rootPath: string;
}

export function PresetManager({ presets, onSelect, onRemove, onAdd, rootPath }: PresetManagerProps) {
  const isDuplicate = presets.some(p => p.path === rootPath);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-5">
        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-50">
          Quick Access Library
        </div>
        {(rootPath && !isDuplicate) && (
          <Button
            variant="ghost"
            onClick={onAdd}
            className="h-8 px-4 text-[10px] font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 tracking-wider rounded-lg border border-transparent hover:border-[var(--accent-primary)]/20 transition-all"
          >
            <Plus size={12} className="mr-2" />
            Pin Current Directory
          </Button>
        )}
      </div>
      
      {presets.length === 0 ? (
        <EmptyState 
          icon={Database}
          compact
          title="No Presets Saved"
          description="Save your current directory as a favorite to quickly switch between projects later."
          iconColor="text-[var(--accent-primary)]/40"
        />
      ) : (
        <div className="flex flex-wrap gap-3">
          {presets.map((preset, index) => {
            const isCurrent = preset.path === rootPath;
            return (
              <div 
                key={preset.id} 
                className={cn(
                  "group animate-in fade-in slide-in-from-left-4 duration-500 flex items-center bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.05] border rounded-xl pl-4 pr-1.5 py-1.5 transition-all cursor-default",
                  isCurrent ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.05)]" : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50"
                )}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => onSelect(preset.path)}
                  className={cn(
                    "text-[12px] font-bold tracking-tight transition-colors pr-3 border-r border-[var(--border-color)]",
                    isCurrent ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)] opacity-60 group-hover:opacity-100"
                  )}
                >
                  {preset.label}
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="ml-1.5 text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--text-primary)]/5 opacity-40 group-hover:opacity-100 transition-all rounded-lg"
                  onClick={() => onRemove(preset.path)}
                >
                  <X size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
