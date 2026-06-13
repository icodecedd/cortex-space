import { CheckCircle2, Settings2, Trash2 } from "@/components/ui/icons";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutType, LayoutConfig, SavedLayout } from "@/lib/setup-constants";
import { getGridCols, getGridRows, getPaneCount } from "@/lib/setup-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SpotlightCard, Spotlight } from "@/components/ui/spotlight";

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  customLayout: LayoutConfig;
  onCustomLayoutChange: (config: Partial<LayoutConfig>) => void;
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
  // All layouts are now dynamic and come from savedLayouts
  const options = useMemo(() => [
    ...savedLayouts.map(l => ({ id: l.id, name: l.name, isSystem: false })),
    { id: 'custom', name: 'Custom', isSystem: true }
  ], [savedLayouts]);

  const handleNumericInput = (val: string, key: 'rows' | 'cols') => {
    if (val === "") {
      onCustomLayoutChange({ [key]: 0 });
      return;
    }
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      onCustomLayoutChange({ [key]: Math.min(4, Math.max(0, parsed)) });
    }
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
              className="relative"
              whileTap={{ scale: 0.97 }}
            >
              <SpotlightCard
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center transition-all duration-300 p-0",
                  isActive 
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.1)]" 
                    : "border-[var(--border-color)] bg-[var(--text-primary)]/[0.01] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--text-primary)]/[0.03]"
                )}
                spotlightColor="rgba(var(--text-primary-rgb), 0.03)"
                borderSpotlightColor={isActive ? "rgba(var(--accent-primary-rgb), 0.2)" : "rgba(var(--text-primary-rgb), 0.1)"}
              >
                <div className="flex flex-col items-center justify-center h-full w-full">
                  {opt.id === 'custom' ? (
                    <Settings2 
                      size={20} 
                      className={cn(
                        "mb-3 transition-colors duration-300",
                        isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)] opacity-50 group-hover/spotlight-card:opacity-100"
                      )} 
                    />
                  ) : (
                    <LayoutMiniPreview type={opt.id} savedLayouts={savedLayouts} isActive={isActive} />
                  )}
                  
                  <div className="flex flex-col items-center gap-0.5 px-3 text-center">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest truncate max-w-full transition-colors duration-300",
                      isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)] opacity-60 group-hover/spotlight-card:opacity-100"
                    )}>
                      {opt.name}
                    </span>
                    {!opt.isSystem && (
                      <span className="font-mono text-[8px] text-[var(--text-secondary)] font-bold opacity-40">
                        {savedLayouts.find(l => l.id === opt.id)?.rows}X{savedLayouts.find(l => l.id === opt.id)?.cols}
                      </span>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute top-2.5 right-2.5"
                    >
                      <CheckCircle2 size={14} className="text-[var(--accent-primary)]" />
                    </motion.div>
                  )}
                </AnimatePresence>

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
                        className="absolute bottom-2 right-2 h-7 w-7 text-[var(--text-secondary)]/40 opacity-0 group-hover/spotlight-card:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-90 rounded-lg"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                      Remove Layout
                    </TooltipContent>
                  </Tooltip>
                )}
              </SpotlightCard>
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
              handleNumericInput={handleNumericInput} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomLayoutForm({ 
  customLayout, 
  handleNumericInput 
}: { 
  customLayout: LayoutConfig, 
  handleNumericInput: (val: string, key: 'rows' | 'cols') => void 
}) {
  return (
    <div className="mt-8">
      <Spotlight className="flex flex-wrap items-center gap-10 rounded-xl border border-[var(--border-color)] bg-[var(--text-primary)]/[0.01] p-6 pr-8">
        <div className="flex items-center gap-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-50">Vertical Rows</div>
          <Input 
            type="number" 
            min="1" 
            max="4" 
            value={customLayout.rows === 0 ? "" : customLayout.rows}
            onChange={(e) => handleNumericInput(e.target.value, 'rows')}
            className="h-10 w-16 bg-[var(--text-primary)]/5 px-2 font-mono text-sm text-center border-[var(--border-color)] focus:border-[var(--accent-primary)] font-bold rounded-lg transition-all"
          />
        </div>
        
        <div className="text-[var(--text-secondary)] opacity-30 font-bold text-xl">×</div>
        
        <div className="flex items-center gap-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-50">Horizontal Columns</div>
          <Input 
            type="number" 
            min="1" 
            max="4" 
            value={customLayout.cols === 0 ? "" : customLayout.cols}
            onChange={(e) => handleNumericInput(e.target.value, 'cols')}
            className="h-10 w-16 bg-[var(--text-primary)]/5 px-2 font-mono text-sm text-center border-[var(--border-color)] focus:border-[var(--accent-primary)] font-bold rounded-lg transition-all"
          />
        </div>

        <div className="ml-auto flex items-center gap-8 pl-8 border-l border-[var(--border-color)]">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-40">Live Preview</span>
            <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
              {(customLayout.rows || 1) * (customLayout.cols || 1)} <span className="text-[var(--accent-primary)]">ACTIVE PANES</span>
            </span>
          </div>
          <div className="h-12 w-12 relative group">
            <div className="absolute inset-0 bg-[var(--accent-primary)]/10 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <LayoutMiniPreview type="custom" customConfig={customLayout} isActive={true} />
          </div>
        </div>
      </Spotlight>
    </div>
  );
}

function LayoutMiniPreview({ type, customConfig, savedLayouts, isActive }: { type: LayoutType, customConfig?: LayoutConfig, savedLayouts?: SavedLayout[], isActive?: boolean }) {
  let config: LayoutConfig | undefined;
  
  if (type === 'custom' && customConfig) {
    config = {
      rows: customConfig.rows || 1,
      cols: customConfig.cols || 1
    };
  } else {
    config = savedLayouts?.find(l => l.id === type);
  }

  if (!config) config = { rows: 2, cols: 2 };

  const cols = getGridCols(config);
  const rows = getGridRows(config);
  const count = getPaneCount(config);

  return (
    <div 
      className={cn(
        "layout-mini-preview w-9 h-9 md:w-11 md:h-11 relative z-10",
        type === 'custom' ? 'm-0' : 'm-0 auto 1rem'
      )} 
      style={{ 
        gridTemplateColumns: cols, 
        gridTemplateRows: rows, 
        gap: '2px',
        padding: '2px',
        background: 'var(--border-color)',
        borderRadius: '6px'
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "transition-colors duration-300 rounded-[2px]",
            isActive ? "bg-[var(--accent-primary)]/20" : "bg-[var(--bg-color)] group-hover/spotlight-card:bg-[var(--text-primary)]/5"
          )} 
        />
      ))}
    </div>
  );
}
