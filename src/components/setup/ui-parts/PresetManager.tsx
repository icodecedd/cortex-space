import { X, Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface PresetManagerProps {
  presets: { label: string; path: string }[];
  onSelect: (path: string) => void;
  onRemove: (path: string) => void;
  onAdd: () => void;
  rootPath: string;
}

export function PresetManager({ presets, onSelect, onRemove, onAdd, rootPath }: PresetManagerProps) {
  const isDuplicate = presets.some(p => p.path === rootPath);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">
          Quick Access Paths
        </div>
        {(rootPath && !isDuplicate) && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onAdd}
            className="h-6 px-2 text-[9px] font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 tracking-widest uppercase rounded"
          >
            <Plus size={10} className="mr-1" />
            Save Current
          </Button>
        )}
      </div>
      
      {presets.length === 0 ? (
        <EmptyState 
          icon={Database}
          compact
          title="No Presets Saved"
          description="Save your current directory as a favorite to quickly switch between projects later."
          iconColor="text-emerald-500/40"
          className="border border-dashed border-white/5 rounded-lg bg-white/[0.01]"
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, index) => {
            const isCurrent = preset.path === rootPath;
            return (
              <div 
                key={preset.id} 
                className={cn(
                  "group animate-in fade-in slide-in-from-left-2 duration-300 flex items-center bg-white/[0.03] hover:bg-white/[0.06] border rounded-full pl-3.5 pr-1 py-1 transition-all cursor-default",
                  isCurrent ? "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5" : "border-white/5"
                )}
                style={{ transitionDelay: `${index * 40}ms` }}
              >
                <button
                  onClick={() => onSelect(preset.path)}
                  className={cn(
                    "text-[11px] font-bold transition-colors pr-2 border-r border-white/5",
                    isCurrent ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
                  )}
                >
                  {preset.label}
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="ml-1 hover:text-red-400 hover:bg-transparent opacity-30 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(preset.path)}
                >
                  <X size={12} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
