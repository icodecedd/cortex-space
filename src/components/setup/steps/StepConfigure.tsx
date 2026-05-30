import { Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { PaneConfig } from "@/lib/setup-constants";
import { PaneConfigCard } from "../ui-parts/PaneConfigCard";

interface StepConfigureProps {
  mode: 'normal' | 'agents';
  activePanes: PaneConfig[];
  updatePaneCommand: (id: number, command: string, isCustom?: boolean) => void;
}

export function StepConfigure({ mode, activePanes, updatePaneCommand }: StepConfigureProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3 
        variants={itemVariants}
        style={{ fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
      >
        <Cpu size={16} color="var(--accent-primary)" />
        03. {mode === 'agents' ? 'Configure AI Agents' : 'Define Command Protocol'}
      </motion.h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {activePanes.map((pane, index) => (
          <motion.div key={pane.id} variants={itemVariants}>
            <PaneConfigCard
              pane={pane}
              index={index}
              mode={mode}
              onUpdate={updatePaneCommand}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
