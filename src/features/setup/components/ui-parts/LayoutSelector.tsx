import { Settings2, Trash2 } from "@/components/ui/icons";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutType, LayoutConfig, SavedLayout } from "@/lib/setup-constants";
import { getPaneCount } from "@/lib/setup-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Spotlight } from "@/components/ui/spotlight";
import { LayoutGridPreview } from "@/components/ui/layout-grid-preview";

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  customLayout: LayoutConfig;
  onCustomLayoutChange: (config: LayoutConfig) => void;
  savedLayouts: SavedLayout[];
  onRemoveSavedLayout?: (id: string) => void;
}

export function LayoutSelector({ 
  currentLayout, 
  onLayoutChange, 
  customLayout, 
  onCustomLayoutChange,
  savedLayouts,
  onRemoveSavedLayout
}: LayoutSelectorProps) {
  const options = useMemo(() => {
    const mode = customLayout.type;
    const filteredSaved = savedLayouts.filter(l => l.config.type === mode);
    return [
      ...filteredSaved.map(l => ({ id: l.id, name: l.name, isSystem: false, config: l.config })),
      { id: 'custom', name: 'Custom', isSystem: true, config: customLayout }
    ];
  }, [savedLayouts, customLayout]);

  const handleUpdate = (updates: Partial<LayoutConfig>) => {
    onCustomLayoutChange({ ...customLayout, ...updates } as LayoutConfig);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {options.map((opt) => {
          const isActive = currentLayout === opt.id;
          return (
            <motion.div
              key={opt.id}
              onClick={() => onLayoutChange(opt.id)}
              className="relative group/layout-card"
              whileTap={{ scale: 0.97 }}
            >
              <div
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center transition-all duration-300 p-0 border rounded-[var(--radius-lg)] overflow-hidden",
                  isActive 
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5" 
                    : "border-[var(--border-color)] bg-[var(--text-primary)]/[0.01] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--text-primary)]/[0.03]"
                )}
              >
                <div className="flex flex-col items-center justify-center h-full w-full">
                  {opt.id === 'custom' ? (
                    <Settings2 
                      size={20} 
                      className={cn(
                        "mb-3 transition-colors duration-300",
                        isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)] opacity-50 group-hover/layout-card:opacity-100"
                      )} 
                    />
                  ) : (
                    <LayoutGridPreview config={opt.config} isActive={isActive} className="w-10 h-10 mb-3" />
                  )}
                  
                  <div className="flex flex-col items-center gap-0.5 px-3 text-center">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest truncate max-w-full transition-colors duration-300",
                      isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)] opacity-60 group-hover/layout-card:opacity-100"
                    )}>
                      {opt.name}
                    </span>
                    {!opt.isSystem && (
                      <span className="text-[8px] text-[var(--text-secondary)] font-bold opacity-40">
                        {opt.config.type === 'grid' ? `${opt.config.rows}X${opt.config.cols}` : `${opt.config.value} PANES`}
                      </span>
                    )}
                  </div>
                </div>

                {!opt.isSystem && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSavedLayout?.(opt.id);
                        }}
                        className="absolute top-2 right-2 h-6 w-6 text-[var(--text-secondary)]/40 opacity-0 group-hover/layout-card:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-90 rounded-md bg-[var(--text-primary)]/5 z-30"
                      >
                        <Trash2 size={10} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                      Remove Layout
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {currentLayout === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CustomLayoutForm 
              customLayout={customLayout} 
              onUpdate={handleUpdate} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomLayoutForm({ 
  customLayout, 
  onUpdate 
}: { 
  customLayout: LayoutConfig, 
  onUpdate: (updates: Partial<LayoutConfig>) => void 
}) {
  const isGrid = customLayout.type === 'grid';

  const handleNumericInput = (val: string, key: 'rows' | 'cols' | 'value') => {
    const max = key === 'value' ? 16 : 4;
    if (val === "") {
      // @ts-ignore
      onUpdate({ [key]: 0 });
      return;
    }
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      // @ts-ignore
      onUpdate({ [key]: Math.min(max, Math.max(0, parsed)) });
    }
  };

  return (
    <div className="mt-6">
      <Spotlight className="rounded-xl border border-[var(--border-color)] bg-[var(--text-primary)]/[0.01] p-4 pr-6 overflow-hidden group shadow-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-8">
            {isGrid ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-50">Vertical Rows</div>
                  <Input 
                    type="number" 
                    min="1" 
                    max="4" 
                    value={customLayout.rows === 0 ? "" : customLayout.rows}
                    onChange={(e) => handleNumericInput(e.target.value, 'rows')}
                    className="h-9 w-14 bg-[var(--text-primary)]/5 px-2 text-xs text-center border-[var(--border-color)] focus:border-[var(--accent-primary)] font-bold rounded-lg transition-all"
                  />
                </div>
                
                <div className="text-[var(--text-secondary)] opacity-30 font-bold text-lg">×</div>
                
                <div className="flex items-center gap-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-50">Horizontal Columns</div>
                  <Input 
                    type="number" 
                    min="1" 
                    max="4" 
                    value={customLayout.cols === 0 ? "" : customLayout.cols}
                    onChange={(e) => handleNumericInput(e.target.value, 'cols')}
                    className="h-9 w-14 bg-[var(--text-primary)]/5 px-2 text-xs text-center border-[var(--border-color)] focus:border-[var(--accent-primary)] font-bold rounded-lg transition-all"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-50">Pane Count</div>
                <Input 
                  type="number" 
                  min="1" 
                  max="16" 
                  value={customLayout.value === 0 ? "" : customLayout.value}
                  onChange={(e) => handleNumericInput(e.target.value, 'value')}
                  className="h-9 w-14 bg-[var(--text-primary)]/5 px-2 text-xs text-center border-[var(--border-color)] focus:border-[var(--accent-primary)] font-bold rounded-lg transition-all"
                />
              </div>
            )}

            <div className="ml-auto flex items-center gap-6 pl-6 border-l border-white/5">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-40">Live Preview</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {getPaneCount(customLayout)} <span className="text-[var(--accent-primary)]">ACTIVE</span>
                </span>
              </div>
              <div className="h-10 w-10 relative">
                <LayoutGridPreview config={customLayout} isActive={true} className="w-10 h-10 relative z-10 shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </Spotlight>
    </div>
  );
}
