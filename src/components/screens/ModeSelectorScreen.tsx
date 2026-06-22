import * as React from "react";
import { useState, useEffect } from "react";
import { Terminal, Users, Cpu } from "@/components/ui/icons";
import { motion, useReducedMotion, Variants } from "framer-motion";
import { Mode } from "@/types";
import { setSetting, getSetting } from "@/lib/store";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { parseShortcutToKeys } from "@/lib/shortcut-utils";
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
  const isMac = typeof window !== 'undefined' && navigator.userAgent.includes('Mac');

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
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[var(--bg-color)]">
      {/* Background ambient detail - Asymmetric glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(var(--accent-primary-rgb),0.05)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(var(--accent-primary-rgb),0.02)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[1200px] px-12 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-16 items-center"
      >
        {/* Left Column: Brand & Intro (Asymmetric focus) */}
        <div className="flex flex-col items-start gap-10 text-left">
          <motion.div
            variants={itemVariants}
            className="w-20 h-20 rounded-[2rem] flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src={ASSETS.LOGO}
              alt="Cortex Logo"
              className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
              onError={(e) => {
                e.currentTarget.src = ASSETS.LOGO_FALLBACK;
              }}
            />
          </motion.div>

          <div className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-[var(--text-primary)] leading-[0.9]">
                {MODE_SELECTOR_CONTENT.TITLE}<br />
                <span className="text-[var(--accent-primary)] brightness-110"> {MODE_SELECTOR_CONTENT.SUBTITLE}</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-lg max-w-[460px] leading-relaxed font-medium">
                {MODE_SELECTOR_CONTENT.DESCRIPTION}
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="w-12 h-1 bg-[var(--accent-primary)]/20 rounded-full"
            />
          </div>

          {showShortcutHints && (
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 pt-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 opacity-50">
                Quick Navigation
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-4">
                {showTemplatesHint && (
                  <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold hover:text-[var(--text-primary)] transition-colors cursor-default">
                    <KbdGroup className="gap-1">
                      {parseShortcutToKeys("Ctrl+Shift+T", isMac).map((key, idx) => (
                        <Kbd key={idx} className="bg-[var(--text-primary)]/5 border-[var(--border-color)]">
                          {key}
                        </Kbd>
                      ))}
                    </KbdGroup>
                    <span className="tracking-tight">{MODE_SELECTOR_CONTENT.HINTS.TEMPLATES}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold hover:text-[var(--text-primary)] transition-colors cursor-default">
                  <KbdGroup className="gap-1">
                    {parseShortcutToKeys("Ctrl+T", isMac).map((key, idx) => (
                      <Kbd key={idx} className="bg-[var(--text-primary)]/5 border-[var(--border-color)]">
                        {key}
                      </Kbd>
                    ))}
                  </KbdGroup>
                  <span className="tracking-tight">{MODE_SELECTOR_CONTENT.HINTS.NEW_SPACE}</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-secondary)] text-xs font-bold hover:text-[var(--text-primary)] transition-colors cursor-default">
                  <KbdGroup className="gap-1">
                    {parseShortcutToKeys("Ctrl+,", isMac).map((key, idx) => (
                      <Kbd key={idx} className="bg-[var(--text-primary)]/5 border-[var(--border-color)]">
                        {key}
                      </Kbd>
                    ))}
                  </KbdGroup>
                  <span className="tracking-tight">{MODE_SELECTOR_CONTENT.HINTS.SETTINGS}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Mode Selection Cards (Staggered & Offset) */}
        <div className="flex flex-col gap-6 w-full relative">
          {/* Subtle connecting line or graphic could go here */}

          <motion.div
            variants={itemVariants}
            onClick={() => handleSelectMode("normal")}
            className="transform md:translate-x-4"
          >
            <SpotlightCard
              className={`group cursor-pointer transition-all duration-500 ambient-glow-card !p-8 border-white/5 hover:border-[var(--accent-primary)]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ${
                lastMode === "normal" ? "active-glow !border-[var(--accent-primary)]/20" : ""
              }`}
            >
              <div className="flex items-center gap-8 relative">
                <div className="absolute -top-4 -right-4 flex items-center gap-2">
                  {lastMode === "normal" && (
                    <span className="text-[9px] font-black text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-3 py-1 rounded-full uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.1)]">
                      Last Session
                    </span>
                  )}
                </div>

                <div className="p-5 rounded-3xl bg-[var(--text-primary)]/5 border border-white/5 group-hover:border-[var(--accent-primary)]/40 group-hover:bg-[var(--accent-primary)]/5 transition-all duration-500 group-hover:scale-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Terminal size={40} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" />
                  </motion.div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tighter group-hover:text-[var(--accent-primary)] transition-colors">
                      {MODE_SELECTOR_CONTENT.NORMAL_MODE.TITLE}
                    </h3>
                    {showShortcutHints && (
                      <KbdGroup className="gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
                        {parseShortcutToKeys("Ctrl+N", isMac).map((key, idx) => (
                          <Kbd key={idx} className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[10px] px-1 h-4 flex items-center justify-center font-mono">
                            {key}
                          </Kbd>
                        ))}
                      </KbdGroup>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--text-secondary)] leading-snug opacity-60 group-hover:opacity-90 transition-opacity max-w-[280px]">
                    {MODE_SELECTOR_CONTENT.NORMAL_MODE.DESCRIPTION}
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => handleSelectMode("agents")}
            className="transform md:-translate-x-4"
          >
            <SpotlightCard
              className={`group cursor-pointer transition-all duration-500 ambient-glow-card !p-8 border-white/5 hover:border-[var(--accent-primary)]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ${
                lastMode === "agents" ? "active-glow !border-[var(--accent-primary)]/20" : ""
              }`}
            >
              <div className="flex items-center gap-8 relative">
                <div className="absolute -top-4 -right-4 flex items-center gap-2">
                  {lastMode === "agents" && (
                    <span className="text-[9px] font-black text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-3 py-1 rounded-full uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.1)]">
                      Last Session
                    </span>
                  )}
                </div>

                <div className="p-5 rounded-3xl bg-[var(--text-primary)]/5 border border-white/5 group-hover:border-[var(--accent-primary)]/40 group-hover:bg-[var(--accent-primary)]/5 transition-all duration-500 group-hover:scale-110 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Users size={40} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" />
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-1 -right-1 bg-[var(--accent-primary)] rounded-full p-1 shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.5)]"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Cpu size={14} className="text-[var(--accent-contrast)]" />
                  </motion.div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tighter group-hover:text-[var(--accent-primary)] transition-colors">
                      {MODE_SELECTOR_CONTENT.AGENTS_MODE.TITLE}
                    </h3>
                    {showShortcutHints && (
                      <KbdGroup className="gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
                        {parseShortcutToKeys("Ctrl+A", isMac).map((key, idx) => (
                          <Kbd key={idx} className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[10px] px-1 h-4 flex items-center justify-center font-mono">
                            {key}
                          </Kbd>
                        ))}
                      </KbdGroup>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--text-secondary)] leading-snug opacity-60 group-hover:opacity-90 transition-opacity max-w-[280px]">
                    {MODE_SELECTOR_CONTENT.AGENTS_MODE.DESCRIPTION}
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});
