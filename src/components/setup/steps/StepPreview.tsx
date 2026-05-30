import { CheckCircle2, Layout, Database, Activity } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutConfig, PaneConfig } from "@/lib/setup-constants";
import { getGridCols, getGridRows } from "@/lib/setup-utils";

interface StepPreviewProps {
  rootPath: string;
  layout: LayoutConfig;
  activePanes: PaneConfig[];
}

export function StepPreview({ rootPath, layout, activePanes }: StepPreviewProps) {
  const layoutString = `${layout.rows}x${layout.cols}`;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8 flex w-full items-center gap-3">
        <CheckCircle2 size={16} className="text-[var(--accent-primary)]" />
        <h3 className="text-sm font-bold tracking-tight">04. Final Protocol Validation</h3>
      </motion.div>

      <div className="grid w-full grid-cols-2 gap-8">
        {/* SUMMARY PANEL */}
        <motion.div variants={itemVariants}>
          <Card className="border-[var(--border-color)] bg-white/[0.02]">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--text-secondary)] uppercase">
                System Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pt-4">
              <div className="flex items-start gap-4">
                <Database size={14} className="mt-1 text-[var(--text-secondary)]" />
                <div className="flex flex-col gap-1">
                  <div className="font-mono text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Path</div>
                  <div className="font-mono text-xs break-all leading-relaxed">{rootPath || "NOT DEFINED"}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Layout size={14} className="mt-1 text-[var(--text-secondary)]" />
                <div className="flex flex-col gap-1">
                  <div className="font-mono text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Grid Matrix</div>
                  <div className="font-mono text-xs font-bold text-[var(--accent-primary)]">{layoutString} CONFIGURATION</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Activity size={14} className="mt-1 text-[var(--text-secondary)]" />
                <div className="flex flex-col gap-1">
                  <div className="font-mono text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Process Load</div>
                  <div className="font-mono text-xs font-bold text-[var(--accent-primary)]">{activePanes.length} ACTIVE TERMINALS</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* VISUAL GRID MINI-MAP */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-[var(--border-color)] bg-white/[0.02]">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--text-secondary)] uppercase">
                Virtual Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div 
                className="aspect-square grid gap-[2px] bg-[var(--border-color)] p-[2px] rounded-sm overflow-hidden"
                style={{
                  gridTemplateColumns: getGridCols(layout),
                  gridTemplateRows: getGridRows(layout)
                }}
              >
                {activePanes.map((pane) => (
                  <div
                    key={pane.id}
                    className="flex items-center justify-center bg-[var(--bg-color)] p-2"
                  >
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="font-mono text-[8px] font-bold text-[var(--accent-primary)] opacity-60">P{pane.id}</div>
                      <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[9px] text-[var(--text-secondary)]">
                        {pane.command || "---"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
