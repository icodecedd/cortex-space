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
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }
    }
  };

  return (
    <motion.div 
      className="max-w-5xl mx-auto w-full py-4 px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-ansi-green/10 text-ansi-green flex items-center justify-center shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Workspace Summary
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed opacity-70 max-w-xl">
          Check your settings before creating your workspace.
        </p>
      </motion.div>

      <div className="flex flex-col gap-6">
        {/* TOP: SETUP DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Database size={12} className="text-[var(--accent-primary)] opacity-50" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-40">
                Project Details
              </h4>
            </div>
            
            <div className="grid gap-3">
              <SummaryItem 
                label="Folder Path" 
                value={rootPath || defaultDir} 
                status="valid"
                icon={<Info size={14} />}
              />
              <SummaryItem 
                label="Active Terminals" 
                value={`${activePanes.length} ACTIVE WINDOW${activePanes.length === 1 ? '' : 'S'}`} 
                status="valid"
                icon={<Cpu size={14} />}
              />
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Layers size={12} className="text-[var(--accent-primary)] opacity-50" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-40">
                Layout Details
              </h4>
            </div>
            
            <div className="grid gap-3">
              <SummaryItem 
                label="Workspace Layout" 
                value={`${layoutString} LAYOUT`} 
                status="valid"
                icon={<Layout size={14} />}
              />
              <div className="px-4 py-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-3">
                {activePanes.slice(0, 4).map((pane) => (
                  <div key={pane.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-30">Terminal 0{pane.id}</span>
                        <span className="text-xs text-[var(--text-primary)] truncate max-w-[180px] font-bold">
                          {pane.command || "system default shell"}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-bold uppercase tracking-wider bg-white/5 border-white/10 opacity-40 rounded">
                      READY
                    </Badge>
                  </div>
                ))}
                {activePanes.length > 4 && (
                  <div className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-widest pt-1 pl-5 opacity-20">
                    + {activePanes.length - 4} additional terminals
                  </div>
                )}
              </div>
            </div>
          </motion.section>

        </div>

        {/* BOTTOM: VISUAL PROXY */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              <Layers size={14} />
            </div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">
              Layout Preview
            </h4>
          </div>

          <Spotlight className="rounded-2xl border border-white/5 bg-white/[0.01] p-1 shadow-lg overflow-hidden group max-w-3xl mx-auto">
            <div className="p-3 px-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/20" />
              </div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-30">
                Workspace Preview
              </span>
            </div>
            
            <div className="p-4 md:p-6">
              <div 
                className="aspect-[16/9] grid gap-2 bg-black/40 p-2 rounded-xl border border-white/5 shadow-inner"
                style={{
                  gridTemplateColumns: isCountMode ? `repeat(${gridCols}, 1fr)` : getGridCols(layout),
                  gridTemplateRows: isCountMode ? 'auto' : getGridRows(layout)
                }}
              >
                {activePanes.map((pane) => (
                  <div
                    key={pane.id}
                    className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] group-hover:border-[var(--accent-primary)]/20 group-hover:bg-[var(--accent-primary)]/[0.03] transition-all duration-500"
                  >
                    <Terminal size={12} className="text-[var(--text-secondary)] opacity-20 group-hover:opacity-100 group-hover:text-[var(--accent-primary)] transition-all mb-1" />
                    <span className="text-[8px] font-bold text-[var(--text-secondary)] opacity-20 group-hover:opacity-100 group-hover:text-[var(--accent-primary)] transition-all">
                      0{pane.id}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 max-w-lg mx-auto">
                <div className="flex items-start gap-4 text-ansi-green bg-ansi-green/5 border border-ansi-green/10 p-5 rounded-xl shadow-sm">
                  <div className="w-7 h-7 rounded-lg bg-ansi-green/10 flex items-center justify-center shrink-0">
                    <Check size={14} />
                  </div>
                  <div className="flex flex-col gap-1 pt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider">All Set</span>
                    <p className="text-[11px] font-medium leading-relaxed opacity-70">
                      Your workspace is ready to be created.
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
    <div className="flex items-center justify-between group p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-[var(--accent-primary)]/20 hover:bg-white/[0.03] transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--text-primary)]/5 border border-white/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]/30 group-hover:bg-[var(--accent-primary)]/5 transition-all duration-300 shadow-inner">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-30 mb-0.5">{label}</span>
          <span className={`text-sm font-bold tracking-tight ${status === 'missing' ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
            {value}
          </span>
        </div>
      </div>
      {status === 'valid' && (
        <div className="text-ansi-green opacity-20 group-hover:opacity-100 transition-opacity duration-300 mr-2">
          <Check size={16} />
        </div>
      )}
    </div>
  );
}