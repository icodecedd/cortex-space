import { CheckCircle2, Settings2, Trash2, Layers, Zap, Plus, X } from "lucide-react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutType, LayoutConfig, SavedLayout } from "@/lib/setup-constants";
import { getGridCols, getGridRows, getPaneCount } from "@/lib/setup-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  customLayout: LayoutConfig;
  onCustomLayoutChange: (config: Partial<LayoutConfig>) => void;
  savedLayouts: SavedLayout[];
  onRemoveSavedLayout?: (id: string) => void;
  onRestoreDefaults?: () => void;
  isInitialized?: boolean;
}

export function LayoutSelector({ 
  currentLayout, 
  onLayoutChange, 
  customLayout, 
  onCustomLayoutChange,
  savedLayouts,
  onRemoveSavedLayout,
  onRestoreDefaults,
  isInitialized
}: LayoutSelectorProps) {
  // All layouts are now dynamic and come from savedLayouts
  const options = useMemo(() => [
    ...savedLayouts.map(l => ({ id: l.id, name: l.name, isSystem: false })),
    { id: 'custom', name: 'CUSTOM', isSystem: true }
  ], [savedLayouts]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {options.map((opt, index) => (
          <motion.div
            key={opt.id}
            onClick={() => onLayoutChange(opt.id)}
            className={cn(
              "layout-card group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border duration-200 overflow-hidden",
              currentLayout === opt.id 
                ? "border-[var(--accent-primary)] bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                : "border-[var(--border-color)] bg-transparent hover:border-[var(--accent-primary)] hover:bg-white/5"
            )}
            whileTap={{ scale: 0.97 }}
          >
            {opt.id === 'custom' ? (
              <Settings2 
                size={16} 
                className={cn(
                  "mb-3",
                  currentLayout === opt.id ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
                )} 
              />
            ) : (
              <LayoutMiniPreview type={opt.id} savedLayouts={savedLayouts} />
            )}
            
            <div className="flex flex-col items-center gap-0.5 px-2 text-center">
              <span className={cn(
                "font-mono text-[9px] font-bold tracking-wider truncate max-w-full",
                currentLayout === opt.id ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
              )}>
                {opt.name.toUpperCase()}
              </span>
              {!opt.isSystem && (
                <span className="font-mono text-[7px] text-[var(--text-secondary)] opacity-50">
                  {savedLayouts.find(l => l.id === opt.id)?.rows}X{savedLayouts.find(l => l.id === opt.id)?.cols}
                </span>
              )}
            </div>

            <AnimatePresence>
              {currentLayout === opt.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute top-2 right-2"
                >
                  <CheckCircle2 size={12} className="text-[var(--accent-primary)]" />
                </motion.div>
              )}
            </AnimatePresence>

            {!opt.isSystem && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSavedLayout?.(opt.id);
                }}
                className="absolute bottom-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 hover:bg-transparent"
              >
                <Trash2 size={10} />
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {currentLayout === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <CustomLayoutForm 
              customLayout={customLayout} 
              onCustomLayoutChange={onCustomLayoutChange} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomLayoutForm({ customLayout, onCustomLayoutChange }: { customLayout: LayoutConfig, onCustomLayoutChange: (config: Partial<LayoutConfig>) => void }) {
  return (
    <div className="flex items-center gap-8 rounded-md border border-[var(--border-color)] bg-white/[0.02] p-5">
      <div className="flex items-center gap-4">
        <div className="font-mono text-[10px] font-medium tracking-tight text-[var(--text-secondary)] uppercase">Rows</div>
        <Input 
          type="number" 
          min="1" 
          max="4" 
          value={customLayout.rows}
          onChange={(e) => onCustomLayoutChange({ rows: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) })}
          className="h-8 w-14 bg-[var(--bg-color)] px-2 font-mono text-xs text-center border-[var(--border-color)]"
        />
      </div>
      <div className="text-[var(--text-secondary)] font-mono text-xs opacity-50">×</div>
      <div className="flex items-center gap-4">
        <div className="font-mono text-[10px] font-medium tracking-tight text-[var(--text-secondary)] uppercase">Cols</div>
        <Input 
          type="number" 
          min="1" 
          max="4" 
          value={customLayout.cols}
          onChange={(e) => onCustomLayoutChange({ cols: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) })}
          className="h-8 w-14 bg-[var(--bg-color)] px-2 font-mono text-xs text-center border-[var(--border-color)]"
        />
      </div>
      <div className="ml-auto flex items-center gap-6">
        <div className="font-mono text-[10px] text-[var(--text-secondary)]">
          PREVIEW: <span className="font-bold text-[var(--accent-primary)]">{customLayout.rows * customLayout.cols} PANES</span>
        </div>
        <div className="h-10 w-10">
          <LayoutMiniPreview type="custom" customConfig={customLayout} />
        </div>
      </div>
    </div>
  );
}

function LayoutMiniPreview({ type, customConfig, savedLayouts }: { type: LayoutType, customConfig?: LayoutConfig, savedLayouts?: SavedLayout[] }) {
  let config: LayoutConfig | undefined;
  
  if (type === 'custom' && customConfig) {
    config = customConfig;
  } else {
    config = savedLayouts?.find(l => l.id === type);
  }

  if (!config) config = { rows: 2, cols: 2 };

  const cols = getGridCols(config);
  const rows = getGridRows(config);
  const count = getPaneCount(config);

  return (
    <div 
      className="layout-mini-preview w-8 h-8 md:w-10 md:h-10" 
      style={{ 
        gridTemplateColumns: cols, 
        gridTemplateRows: rows, 
        margin: type === 'custom' ? '0' : '0 auto 0.75rem' 
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--bg-color)] ring-1 ring-[var(--border-color)]/30" />
      ))}
    </div>
  );
}
