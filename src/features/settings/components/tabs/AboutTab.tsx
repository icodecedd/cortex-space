import { SettingsCard } from "../shared/SettingsUI";
import { Button } from "@/components/ui/button";
import { Info, Book, RefreshCcw, Github, Globe } from "@/components/ui/icons";
import { motion, Variants } from "framer-motion";

export function AboutTab() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-0 pb-10 pr-2"
    >
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="System Identity" 
          icon={<Info size={16} />}
          description="Version information and core environment details."
        >
          <div className="flex flex-col items-center py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--border-color)]/40 flex items-center justify-center shadow-inner border border-[var(--border-color)] p-2.5 group hover:border-[var(--accent-primary)]/40 transition-colors duration-500">
              <img
                src="/cortex-logo.png"
                alt="Cortex Logo"
                className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                Cortex Space
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase tracking-widest opacity-60">
                Release v0.1.0-alpha
              </p>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] max-w-[280px] text-center leading-relaxed font-medium">
              A highly optimized, modular workspace orchestrator. Designed
              for maximum throughput and rich aesthetics.
            </p>
            <div className="pt-2 flex gap-2">
              <Button variant="outline" className="h-8 text-[10px] px-3 font-bold uppercase tracking-wider bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] transition-all">
                <Book size={12} className="mr-2" /> Documentation
              </Button>
              <Button variant="outline" className="h-8 text-[10px] px-3 font-bold uppercase tracking-wider bg-[var(--text-primary)]/[0.03] border-[var(--border-color)]/20 hover:bg-[var(--text-primary)]/[0.05] transition-all">
                <RefreshCcw size={12} className="mr-2" /> Check Updates
              </Button>
            </div>
          </div>
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Community & Links" 
          icon={<Globe size={16} />}
          description="Connect with the Cortex team and development resources."
        >
          <div className="grid grid-cols-2 gap-3 p-1">
            <Button variant="ghost" className="h-10 justify-start px-4 text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--text-primary)]/[0.03] group">
              <Github size={14} className="mr-3 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
              Source Code
            </Button>
            <Button variant="ghost" className="h-10 justify-start px-4 text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--text-primary)]/[0.03] group">
              <div className="w-3.5 h-3.5 mr-3 flex items-center justify-center bg-[var(--text-secondary)] group-hover:bg-[var(--accent-primary)] rounded-full transition-colors" />
              X / Twitter
            </Button>
          </div>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}
