import { Layout, Database, Terminal, Check, Info, Layers, Cpu, ShieldCheck } from "@/components/ui/icons";
import { motion, Variants } from "framer-motion";
import { LayoutConfig, PaneConfig } from "@/lib/setup-constants";
import { getGridCols, getGridRows } from "@/lib/setup-utils";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";

interface StepPreviewProps {
  rootPath: string;
  defaultDir: string;
  layout: LayoutConfig;
  activePanes: PaneConfig[];
}

export function StepPreview({ rootPath, defaultDir, layout, activePanes }: StepPreviewProps) {
  const layoutString = layout.type === 'grid' ? `${layout.rows}x${layout.cols}` : `${layout.value} PANES`;
  const isCountMode = layout.type === 'count';
  const gridCols = isCountMode ? Math.ceil(Math.sqrt(layout.value)) : undefined;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto w-full py-2 pr-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1 mb-12">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
            <ShieldCheck size={16} />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Space Blueprint
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] font-medium opacity-70">
          Verify your configuration details before initializing the workspace environment.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* LEFT: SETUP DETAILS */}
        <div className="md:col-span-7 space-y-10">
          
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-color)]">
              <Database size={14} className="text-[var(--text-secondary)] opacity-50" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-60">
                Environment
              </h4>
            </div>
            
            <div className="grid gap-6">
              <SummaryItem 
                label="Root Directory" 
                value={rootPath || defaultDir} 
                status="valid"
                icon={<Info size={14} />}
              />
              <SummaryItem 
                label="Execution Units" 
                value={`${activePanes.length} ACTIVE PANE${activePanes.length === 1 ? '' : 'S'}`} 
                status="valid"
                icon={<Cpu size={14} />}
              />
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-color)]">
              <Layers size={14} className="text-[var(--text-secondary)] opacity-50" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-60">
                Grid Architecture
              </h4>
            </div>
            
            <div className="grid gap-6">
              <SummaryItem 
                label="Layout Pattern" 
                value={`${layoutString} MATRIX`} 
                status="valid"
                icon={<Layout size={14} />}
              />
              <div className="pl-11 space-y-4">
                {activePanes.slice(0, 4).map((pane) => (
                  <div key={pane.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.5)]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-40">Pane 0{pane.id}</span>
                        <span className="text-xs font-mono text-[var(--text-primary)] truncate max-w-[240px] font-medium">
                          {pane.command || "system default shell"}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="h-6 px-2.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--text-primary)]/5 border-[var(--border-color)] opacity-60 rounded-md">
                      Pending
                    </Badge>
                  </div>
                ))}
                {activePanes.length > 4 && (
                  <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest pl-5.5 opacity-30">
                    + {activePanes.length - 4} additional units
                  </div>
                )}
              </div>
            </div>
          </motion.section>

        </div>

        {/* RIGHT: VISUAL PROXY */}
        <motion.div variants={itemVariants} className="md:col-span-5">
          <Spotlight className="rounded-xl border border-[var(--border-color)] bg-[var(--text-primary)]/[0.01] p-1 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden group">
            <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--text-primary)]/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                <div className="w-2 h-2 rounded-full bg-green-500/20" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-40">
                Visual Matrix
              </span>
            </div>
            
            <div className="p-8">
              <div 
                className="aspect-[4/3] grid gap-1.5 bg-black/40 p-2 rounded-lg border border-[var(--border-color)] shadow-inner"
                style={{
                  gridTemplateColumns: isCountMode ? `repeat(${gridCols}, 1fr)` : getGridCols(layout),
                  gridTemplateRows: isCountMode ? 'auto' : getGridRows(layout)
                }}
              >
                {activePanes.map((pane) => (
                  <div
                    key={pane.id}
                    className="flex flex-col items-center justify-center rounded-md border border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] group-hover:border-[var(--accent-primary)]/20 group-hover:bg-[var(--accent-primary)]/[0.02] transition-all duration-500"
                  >
                    <Terminal size={14} className="text-[var(--text-secondary)] opacity-20 group-hover:opacity-100 group-hover:text-[var(--accent-primary)] transition-all mb-1.5" />
                    <span className="text-[9px] font-mono font-bold text-[var(--text-secondary)] opacity-30 group-hover:opacity-100 group-hover:text-[var(--accent-primary)] transition-all">
                      0{pane.id}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-10 space-y-4">
                <div className="flex items-start gap-4 text-ansi-green bg-ansi-green/5 border border-ansi-green/10 p-4 rounded-xl">
                  <div className="w-6 h-6 rounded-lg bg-ansi-green/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(29,158,117,0.2)]">
                    <Check size={14} />
                  </div>
                  <div className="flex flex-col gap-1 pt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Integrity Check Passed</span>
                    <p className="text-[11px] font-medium leading-relaxed opacity-70">
                      All systems are operational. The workspace is ready for immediate initialization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Spotlight>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SummaryItem({ label, value, status, icon }: { 
  label: string; 
  value: string; 
  status: 'valid' | 'missing' | 'warning';
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--text-primary)]/5 border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:border-[var(--accent-primary)]/50 group-hover:bg-[var(--text-primary)]/[0.08] transition-all duration-300">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em] opacity-40 mb-0.5">{label}</span>
          <span className={`text-sm font-bold tracking-tight ${status === 'missing' ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
            {value}
          </span>
        </div>
      </div>
      {status === 'valid' && (
        <div className="mt-3 text-ansi-green opacity-40 group-hover:opacity-100 transition-opacity">
          <Check size={16} />
        </div>
      )}
    </div>
  );
}
