import { X, Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface PresetManagerProps {
  presets: { label: string; path: string }[];
  onSelect: (path: string) => void;
  onRemove: (path: string) => void;
  onAdd: () => void;
  rootPath: string;
}

export function PresetManager({ presets, onSelect, onRemove, onAdd, rootPath }: PresetManagerProps) {
  return (
    <div className="mt-8">
      <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">
        Quick Access Paths
      </div>
      
      {presets.length === 0 ? (
        <EmptyState 
          icon={Database}
          compact
          title="No Presets Saved"
          description="Save your current directory as a favorite to quickly switch between projects later."
          iconColor="text-emerald-500/40"
          action={rootPath ? {
            label: "Save Current Path",
            onClick: onAdd,
            icon: Plus
          } : undefined}
          className="border border-dashed border-[var(--border-color)] rounded-lg bg-white/[0.01]"
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, index) => (
            <div 
              key={preset.path} 
              className="group animate-in fade-in slide-in-from-left-2 duration-300 flex items-center bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-full pl-3.5 pr-1 py-1 transition-all cursor-default"
              style={{ transitionDelay: `${index * 40}ms` }}
            >
              <button
                onClick={() => onSelect(preset.path)}
                className="text-[11px] font-bold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors pr-2 border-r border-white/5"
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
          ))}
        </div>
      )}
    </div>
  );
}
