import { Layout, Database, Terminal, Check, Info, Layers, Cpu, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LayoutConfig, PaneConfig } from "@/lib/setup-constants";
import { getGridCols, getGridRows } from "@/lib/setup-utils";
import { Badge } from "@/components/ui/badge";

interface StepPreviewProps {
  rootPath: string;
  defaultDir: string;
  layout: LayoutConfig;
  activePanes: PaneConfig[];
}

export function StepPreview({ rootPath, defaultDir, layout, activePanes }: StepPreviewProps) {
  const layoutString = `${layout.rows}x${layout.cols}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto w-full py-2 pr-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1 mb-10">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={16} className="text-[var(--accent-primary)]" />
          <h3 className="text-lg font-semibold tracking-tight text-white uppercase">
            Protocol Manifest
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Ensure your environment parameters are correct before initializing the space.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT: MANIFEST DETAILS */}
        <div className="md:col-span-7 space-y-8">
          
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Database size={14} className="text-[var(--text-secondary)]" />
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                Environment
              </h4>
            </div>
            
            <div className="grid gap-4">
              <ManifestItem 
                label="Target Directory" 
                value={rootPath || defaultDir} 
                status="valid"
                icon={<Info size={12} />}
              />
              <ManifestItem 
                label="Process Count" 
                value={`${activePanes.length} Terminal Session${activePanes.length === 1 ? '' : 's'}`} 
                status="valid"
                icon={<Cpu size={12} />}
              />
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Layers size={14} className="text-[var(--text-secondary)]" />
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                Architecture
              </h4>
            </div>
            
            <div className="grid gap-4">
              <ManifestItem 
                label="Grid Topology" 
                value={`${layoutString} Matrix`} 
                status="valid"
                icon={<Layout size={12} />}
              />
              <div className="pl-6 space-y-3">
                {activePanes.slice(0, 4).map((pane) => (
                  <div key={pane.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] opacity-20 group-hover:opacity-60 transition-opacity" />
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">P0{pane.id}</span>
                      <span className="text-xs font-mono text-white truncate max-w-[200px]">
                        {pane.command || "default shell"}
                      </span>
                    </div>
                    <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-mono bg-white/[0.02] border-white/5 opacity-40 rounded-sm">
                      READY
                    </Badge>
                  </div>
                ))}
                {activePanes.length > 4 && (
                  <div className="text-[10px] text-[var(--text-secondary)] italic pl-4.5">
                    + {activePanes.length - 4} additional processes
                  </div>
                )}
              </div>
            </div>
          </motion.section>

        </div>

        {/* RIGHT: VISUAL PROOF */}
        <motion.div variants={itemVariants} className="md:col-span-5">
          <Card className="p-1 border-white/5 bg-white/[0.01] shadow-2xl overflow-hidden group rounded-md">
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                Viewport Preview
              </span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/5" />
                <div className="w-2 h-2 rounded-full bg-white/5" />
              </div>
            </div>
            
            <div className="p-6">
              <div 
                className="aspect-[4/3] grid gap-0.5 bg-white/[0.03] p-1 rounded-md border border-white/5 shadow-inner"
                style={{
                  gridTemplateColumns: getGridCols(layout),
                  gridTemplateRows: getGridRows(layout)
                }}
              >
                {activePanes.map((pane) => (
                  <div
                    key={pane.id}
                    className="flex flex-col items-center justify-center rounded-[1px] border border-white/5 bg-[var(--bg-color)] group-hover:border-white/10 transition-all duration-300"
                  >
                    <Terminal size={12} className="text-[var(--text-secondary)] opacity-30 group-hover:opacity-60 transition-opacity mb-1" />
                    <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-50">
                      0{pane.id}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-emerald-500/80 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-md">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Check size={12} />
                  </div>
                  <p className="text-[11px] font-medium leading-tight">
                    Protocol validated. All system requirements for this configuration are satisfied.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ManifestItem({ label, value, status, icon }: { 
  label: string; 
  value: string; 
  status: 'valid' | 'missing' | 'warning';
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-white/[0.03] border border-white/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] group-hover:border-white/10 transition-all">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
          <span className={`text-sm font-medium ${status === 'missing' ? 'text-red-400' : 'text-white'}`}>
            {value}
          </span>
        </div>
      </div>
      {status === 'valid' && (
        <div className="mt-2 text-emerald-500 opacity-60">
          <Check size={14} />
        </div>
      )}
    </div>
  );
}
