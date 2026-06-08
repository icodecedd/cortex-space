import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Cpu, CheckCircle2, Loader2, AlertCircle, Download, RefreshCw, ArrowRight } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Agent } from "@/types";

interface AgentOnboardingScreenProps {
  onComplete: () => void;
  agents: Agent[];
  installAgent: (id: string) => Promise<void>;
  isInitialized: boolean;
}

export function AgentOnboardingScreen({ onComplete, agents, installAgent, isInitialized }: AgentOnboardingScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  // Count active agents and check if any are currently installing
  const activeCount = agents.filter(a => a.isDefault && a.status === 'installed').length;
  const isAnyInstalling = agents.filter(a => a.isDefault).some(a => a.status === 'installing');

  if (!isInitialized) {
    const dotVariants = {
      animate: {
        opacity: [0, 1, 0],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut" as any
        }
      }
    };

    return (
      <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-color)]">
        {/* Subtle glow aligned with the theme accent */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] rounded-full blur-[100px] pointer-events-none" 
          style={{ backgroundColor: "var(--accent-primary)", opacity: 0.1 }}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 flex flex-col items-center gap-1.5"
        >
          <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[var(--text-secondary)] uppercase flex items-center select-none">
            AWAKENING SYSTEM
            <span className="flex ml-0.5">
              <motion.span variants={dotVariants} animate="animate">.</motion.span>
              <motion.span variants={dotVariants} animate="animate" transition={{ delay: 0.2 }}>.</motion.span>
              <motion.span variants={dotVariants} animate="animate" transition={{ delay: 0.4 }}>.</motion.span>
            </span>
          </span>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.08, 
        delayChildren: 0.1 
      } 
    },
    exit: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.98,
      transition: { duration: 0.3 }
    }
  };

  const innerContainerVariants = {
    hidden: { opacity: 1 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.06, 
        delayChildren: 0.05 
      } 
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 12,
      scale: shouldReduceMotion ? 1 : 0.97
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring",
        duration: 0.45,
        bounce: 0.1
      } as any 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full h-full flex flex-col items-center justify-center p-8 bg-[var(--bg-color)]"
    >
      <motion.div 
        variants={innerContainerVariants}
        className="max-w-md w-full flex flex-col items-center gap-8"
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)]">
            <Cpu size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] uppercase mb-2">
              AI Agent Protocols
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Scan and configure your AI agentic coding CLI tools.
            </p>
          </div>
        </motion.div>

        {/* Individual agent items as direct children of the staggered container for fluid motion */}
        {agents.filter(a => a.isDefault).map(agent => (
          <motion.div 
            key={agent.id} 
            variants={itemVariants}
            className="w-full flex flex-col p-4 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)]/50 gap-2 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-200 ${
                  agent.status === 'installed' ? 'bg-ansi-green/10 text-ansi-green' :
                  agent.status === 'error' ? 'bg-ansi-red/10 text-ansi-red' :
                  'bg-[var(--text-primary)]/5 text-[var(--text-secondary)]'
                }`}>
                  <Cpu size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight text-[var(--text-primary)] uppercase">
                    {agent.label}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60">
                    {agent.command}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 h-7 relative">
                <AnimatePresence mode="wait">
                  {agent.status === 'installed' && (
                    <motion.div
                      key="installed"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-center gap-1.5"
                    >
                      <span className="text-[10px] font-bold text-ansi-green uppercase tracking-tighter">Detected</span>
                      <CheckCircle2 size={16} className="text-ansi-green" />
                    </motion.div>
                  )}
                  {agent.status === 'installing' && (
                    <motion.div
                      key="installing"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-center gap-1.5"
                    >
                      <span className="text-[10px] font-bold text-ansi-blue uppercase tracking-tighter">Installing</span>
                      <Loader2 size={16} className="text-ansi-blue animate-spin" />
                    </motion.div>
                  )}
                  {agent.status === 'not-installed' && (
                    <motion.div
                      key="not-installed"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => installAgent(agent.id)}
                        className="h-7 text-[10px] px-3 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all uppercase tracking-widest font-bold bg-[var(--surface-color)] active:scale-[0.97] active:translate-y-0 duration-150 flex items-center gap-1.5"
                      >
                        <Download size={11} />
                        Install
                      </Button>
                    </motion.div>
                  )}
                  {agent.status === 'error' && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-center gap-1.5"
                    >
                      <span className="text-[10px] font-bold text-ansi-red uppercase tracking-tighter">Failed</span>
                      <AlertCircle size={16} className="text-ansi-red" />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => installAgent(agent.id)}
                        className="h-7 text-[10px] px-3 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all uppercase tracking-widest font-bold ml-1 bg-[var(--surface-color)] active:scale-[0.97] active:translate-y-0 duration-150 flex items-center gap-1.5"
                      >
                        <RefreshCw size={11} />
                        Retry
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <AnimatePresence>
              {agent.status === 'installing' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] h-1.5 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-ansi-blue w-1/3"
                      initial={{ x: "-100%" }}
                      animate={{ x: "300%" }}
                      transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        <motion.div variants={itemVariants} className="w-full text-center px-2">
          {isInitialized && (
            <p className="text-[11px] font-medium leading-normal">
              {activeCount > 0 ? (
                <span className="text-ansi-green font-bold uppercase tracking-wider">
                  ✓ {activeCount} active protocol{activeCount > 1 ? 's' : ''} ready
                </span>
              ) : (
                <span className="text-ansi-yellow font-bold uppercase tracking-wider">
                  ⚠ No active AI protocols configured
                </span>
              )}
            </p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="w-full flex flex-col gap-3">
          <Button 
            onClick={onComplete}
            className="w-full h-12 text-xs font-bold uppercase tracking-widest bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 transition-all flex items-center justify-center gap-2 overflow-hidden active:scale-[0.97] active:translate-y-0 duration-150"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isAnyInstalling ? "installing" : "ready"}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center gap-2"
              >
                {isAnyInstalling ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Configuring Matrix & Launching...
                  </>
                ) : (
                  <>
                    Continue to Workspace
                    <ArrowRight size={12} />
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
