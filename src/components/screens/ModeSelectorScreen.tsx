import * as React from "react";
import { useState, useEffect } from "react";
import { Terminal, Users, Cpu } from "@/components/ui/icons";
import { motion, useReducedMotion, Variants } from "framer-motion";
import { Mode } from "@/types";
import { setSetting, getSetting } from "@/lib/store";
import { Kbd } from "@/components/ui/kbd";
import { MODE_SELECTOR_CONTENT, ASSETS } from "@/lib/content";
import { SpotlightCard } from "@/components/ui/spotlight";

interface ModeSelectorScreenProps {
  onSelectMode: (mode: Mode) => void;
  onBack?: () => void;
  showShortcutHints?: boolean;
  showTemplatesHint?: boolean;
}

export const ModeSelectorScreen = React.memo(({ onSelectMode, onBack, showShortcutHints = true, showTemplatesHint = true }: ModeSelectorScreenProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [lastMode, setLastMode] = useState<Mode | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onBack?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  useEffect(() => {
    getSetting<Mode>("startup.lastMode", "normal").then(setLastMode);
  }, []);

  const handleSelectMode = async (mode: Mode) => {
    await setSetting("startup.lastMode", mode);
    onSelectMode(mode);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as any
      }
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      {/* Background ambient detail */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,102,178,0.03)_0%,transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[640px] px-8 flex flex-col items-center"
      >
        <div className="flex flex-col items-center gap-12 w-full">
          <div className="text-center flex flex-col items-center gap-6">
            <motion.div
              variants={itemVariants}
              className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center overflow-hidden shadow-2xl shadow-[var(--accent-primary)]/20"
            >
              <img
                src={ASSETS.LOGO}
                alt="Cortex Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = ASSETS.LOGO_FALLBACK;
                }}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                {MODE_SELECTOR_CONTENT.TITLE}<span className="text-[var(--accent-primary)]"> {MODE_SELECTOR_CONTENT.SUBTITLE}</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-sm max-w-[420px] mx-auto leading-relaxed opacity-80">
                {MODE_SELECTOR_CONTENT.DESCRIPTION}
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="w-8 h-px bg-[var(--border-color)]"
            />

            <motion.p
              variants={itemVariants}
              className="text-[var(--text-primary)] text-lg font-medium tracking-tight"
            >
              {MODE_SELECTOR_CONTENT.PROMPT}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-4 w-full">
            <motion.div variants={itemVariants} onClick={() => handleSelectMode("normal")}>
              <SpotlightCard
                className={`group cursor-pointer transition-all duration-300 ambient-glow-card ${
                  lastMode === "normal" ? "active-glow" : ""
                }`}
              >
                <div className="flex items-start gap-6 relative">
                  <div className="absolute top-0 right-0 flex items-center gap-2">
                    {lastMode === "normal" && (
                      <span className="text-[10px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Last Used
                      </span>
                    )}
                    {showShortcutHints && (
                      <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-normal text-[10px]">
                        {MODE_SELECTOR_CONTENT.NORMAL_MODE.SHORTCUT_LABEL}
                      </Kbd>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--text-primary)]/5 border border-[var(--border-color)] group-hover:border-[var(--accent-primary)]/50 group-hover:bg-[var(--text-primary)]/10 transition-colors">
                    <Terminal size={32} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </div>

                  <div className="flex-1 pt-1">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
                      {MODE_SELECTOR_CONTENT.NORMAL_MODE.TITLE}
                    </h3>
                    <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed opacity-70">
                      {MODE_SELECTOR_CONTENT.NORMAL_MODE.DESCRIPTION}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            <motion.div variants={itemVariants} onClick={() => handleSelectMode("agents")}>
              <SpotlightCard
                className={`group cursor-pointer transition-all duration-300 ambient-glow-card ${
                  lastMode === "agents" ? "active-glow" : ""
                }`}
              >
                <div className="flex items-start gap-6 relative">
                  <div className="absolute top-0 right-0 flex items-center gap-2">
                    {lastMode === "agents" && (
                      <span className="text-[10px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Last Used
                      </span>
                    )}
                    {showShortcutHints && (
                      <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-normal text-[10px]">
                        {MODE_SELECTOR_CONTENT.AGENTS_MODE.SHORTCUT_LABEL}
                      </Kbd>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--text-primary)]/5 border border-[var(--border-color)] group-hover:border-[var(--accent-primary)]/50 group-hover:bg-[var(--text-primary)]/10 transition-colors relative">
                    <Users size={32} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                    <Cpu
                      size={16}
                      className="absolute -bottom-1 -right-1 bg-[var(--bg-color)] rounded-full p-0.5 text-[var(--accent-primary)] border border-[var(--border-color)]"
                    />
                  </div>

                  <div className="flex-1 pt-1">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
                      {MODE_SELECTOR_CONTENT.AGENTS_MODE.TITLE}
                    </h3>
                    <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed opacity-70">
                      {MODE_SELECTOR_CONTENT.AGENTS_MODE.DESCRIPTION}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>

          {showShortcutHints && (
            <motion.div
              variants={itemVariants}
              className="flex justify-center gap-8 pt-4 flex-wrap"
            >
              {showTemplatesHint && (
                <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-medium opacity-60 hover:opacity-100 transition-opacity">
                  <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)]">Ctrl + Shift + T</Kbd>
                  <span>{MODE_SELECTOR_CONTENT.HINTS.TEMPLATES}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-medium opacity-60 hover:opacity-100 transition-opacity">
                <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)]">Ctrl + T</Kbd>
                <span>{MODE_SELECTOR_CONTENT.HINTS.NEW_SPACE}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-medium opacity-60 hover:opacity-100 transition-opacity">
                <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)]">Ctrl + ,</Kbd>
                <span>{MODE_SELECTOR_CONTENT.HINTS.SETTINGS}</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
});
