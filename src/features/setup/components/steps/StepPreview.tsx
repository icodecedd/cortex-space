import { Layout, Database, Terminal, Check, Info, Layers, Cpu, ShieldCheck } from "@/components/ui/icons";
import { motion, Variants } from "framer-motion";
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants: Variants = {
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
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Setup Summary
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] font-medium">
          Ensure your workspace settings are correct before launching.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT: SETUP DETAILS */}
        <div className="md:col-span-7 space-y-8">
          
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
              <Database size={14} className="text-[var(--text-secondary)]" />
              <h4 className="text-[11px] font-bold text-[var(--text-secondary)]">
                Environment
              </h4>
            </div>
            
            <div className="grid gap-4">
              <SummaryItem 
                label="Workspace Directory" 
                value={rootPath || defaultDir} 
                status="valid"
                icon={<Info size={12} />}
              />
              <SummaryItem 
                label="Terminal Panes" 
                value={`${activePanes.length} Pane${activePanes.length === 1 ? '' : 's'}`} 
                status="valid"
                icon={<Cpu size={12} />}
              />
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
              <Layers size={14} className="text-[var(--text-secondary)]" />
              <h4 className="text-[11px] font-bold text-[var(--text-secondary)]">
                Layout
              </h4>
            </div>
            
            <div className="grid gap-4">
              <SummaryItem 
                label="Grid Structure" 
                value={`${layoutString} Layout`} 
                status="valid"
                icon={<Layout size={12} />}
              />
              <div className="pl-6 space-y-3">
                {activePanes.slice(0, 4).map((pane) => (
                  <div key={pane.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] opacity-40 group-hover:opacity-80 transition-opacity" />
                      <span className="text-[11px] font-mono text-[var(--text-secondary)] font-bold">Pane {pane.id}</span>
                      <span className="text-xs font-mono text-[var(--text-primary)] truncate max-w-[200px] font-medium">
                        {pane.command || "default shell"}
                      </span>
                    </div>
                    <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-mono bg-[var(--text-primary)]/5 border-[var(--border-color)] opacity-80 rounded-sm font-bold">
                      Ready
                    </Badge>
                  </div>
                ))}
                {activePanes.length > 4 && (
                  <div className="text-[10px] text-[var(--text-secondary)] font-bold italic pl-4.5">
                    + {activePanes.length - 4} additional panes
                  </div>
                )}
              </div>
            </div>
          </motion.section>

        </div>

        {/* RIGHT: VISUAL PROXY */}
        <motion.div variants={itemVariants} className="md:col-span-5">
          <Card className="p-1 border-[var(--border-color)] bg-[var(--text-primary)]/5 shadow-2xl overflow-hidden group rounded-md">
            <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--text-primary)]/5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                Workspace Preview
              </span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--text-primary)]/10" />
                <div className="w-2 h-2 rounded-full bg-[var(--text-primary)]/10" />
              </div>
            </div>
            
            <div className="p-6">
              <div 
                className="aspect-[4/3] grid gap-0.5 bg-[var(--text-primary)]/5 p-1 rounded-md border border-[var(--border-color)] shadow-inner"
                style={{
                  gridTemplateColumns: getGridCols(layout),
                  gridTemplateRows: getGridRows(layout)
                }}
              >
                {activePanes.map((pane) => (
                  <div
                    key={pane.id}
                    className="flex flex-col items-center justify-center rounded-[1px] border border-[var(--border-color)] bg-[var(--bg-color)] group-hover:border-[var(--text-primary)]/20 transition-all duration-300"
                  >
                    <Terminal size={12} className="text-[var(--text-secondary)] opacity-60 group-hover:opacity-100 transition-opacity mb-1" />
                    <span className="text-[8px] font-mono text-[var(--text-secondary)] font-bold">
                      0{pane.id}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-green-700 dark:text-ansi-green bg-ansi-green/5 border border-ansi-green/20 p-3 rounded-md">
                  <div className="w-5 h-5 rounded-full bg-ansi-green/10 flex items-center justify-center shrink-0 text-green-600 dark:text-ansi-green">
                    <Check size={12} />
                  </div>
                  <p className="text-[11px] font-bold leading-tight">
                    Everything is configured correctly. Your workspace is ready to launch.
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

function SummaryItem({ label, value, status, icon }: { 
  label: string; 
  value: string; 
  status: 'valid' | 'missing' | 'warning';
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-[var(--text-primary)]/5 border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]/20 transition-all">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[var(--text-secondary)]">{label}</span>
          <span className={`text-sm font-bold ${status === 'missing' ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>
            {value}
          </span>
        </div>
      </div>
      {status === 'valid' && (
        <div className="mt-2 text-green-600 dark:text-ansi-green opacity-80">
          <Check size={14} />
        </div>
      )}
    </div>
  );
}
