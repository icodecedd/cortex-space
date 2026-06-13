import * as React from "react";
import { useState, useEffect } from "react";
import { Terminal, Users, Cpu } from "@/components/ui/icons";
import { motion, useReducedMotion, Variants } from "framer-motion";
import { Mode } from "@/types";
import { setSetting, getSetting } from "@/lib/store";
import { Kbd } from "@/components/ui/kbd";
import { MODE_SELECTOR_CONTENT, ASSETS } from "@/lib/content";

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
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 8,
      scale: shouldReduceMotion ? 1 : 0.99
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as any // Quintic ease-out: professional & snappy
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        display: "flex",
        width: "100%",
        maxWidth: "600px",
        padding: "2rem",
        margin: "0 auto",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "3rem",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <motion.div
            variants={itemVariants}
            style={{
              background: "var(--accent-primary)",
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={ASSETS.LOGO}
              alt="Cortex Logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.src = ASSETS.LOGO_FALLBACK;
              }}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <h1
              style={{
                fontSize: "2.5rem",
                marginBottom: "0.5rem",
                letterSpacing: "0.05em",
                color: "var(--text-primary)",
              }}
            >
              {MODE_SELECTOR_CONTENT.TITLE}<span style={{ color: "var(--accent-primary)" }}> {MODE_SELECTOR_CONTENT.SUBTITLE}</span>
            </h1>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                letterSpacing: "0.05em",
                opacity: 0.7,
                maxWidth: "400px",
                lineHeight: "1.4",
              }}
            >
              {MODE_SELECTOR_CONTENT.DESCRIPTION}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            style={{
              width: "30px",
              height: "1px",
              background: "var(--border-color)",
            }}
          />

          <motion.p
            variants={itemVariants}
            style={{
              color: "var(--text-primary)",
              fontSize: "1rem",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            {MODE_SELECTOR_CONTENT.PROMPT}
          </motion.p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            width: "100%",
          }}
        >
          <motion.div
            variants={itemVariants}
            onClick={() => handleSelectMode("normal")}
            className="mode-card"
            style={{
              position: "relative",
              flexDirection: "row",
              padding: "1.5rem 2rem",
              justifyContent: "flex-start",
              gap: "1.5rem",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              borderColor: lastMode === "normal" ? "var(--accent-primary)" : "var(--border-color)",
              boxShadow: lastMode === "normal" ? "0 0 12px rgba(var(--accent-primary-rgb), 0.05)" : undefined,
            }}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {lastMode === "normal" && (
                <span className="text-[9px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2 py-0.5 rounded-full">
                  Last Used
                </span>
              )}
              {showShortcutHints && (
                <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-normal text-[10px]">
                  {MODE_SELECTOR_CONTENT.NORMAL_MODE.SHORTCUT_LABEL}
                </Kbd>
              )}
            </div>
            <Terminal size={32} color="var(--text-secondary)" />
            <div style={{ textAlign: "left", flex: 1 }}>
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                }}
              >
                <span>{MODE_SELECTOR_CONTENT.NORMAL_MODE.TITLE}</span>
              </h3>
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.25rem",
                  fontFamily: "JetBrains Mono",
                }}
              >
                {MODE_SELECTOR_CONTENT.NORMAL_MODE.DESCRIPTION}
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => handleSelectMode("agents")}
            className="mode-card"
            style={{
              position: "relative",
              flexDirection: "row",
              padding: "1.5rem 2rem",
              justifyContent: "flex-start",
              gap: "1.5rem",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              borderColor: lastMode === "agents" ? "var(--accent-primary)" : "var(--border-color)",
              boxShadow: lastMode === "agents" ? "0 0 12px rgba(var(--accent-primary-rgb), 0.05)" : undefined,
            }}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {lastMode === "agents" && (
                <span className="text-[9px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2 py-0.5 rounded-full">
                  Last Used
                </span>
              )}
              {showShortcutHints && (
                <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-normal text-[10px]">
                  {MODE_SELECTOR_CONTENT.AGENTS_MODE.SHORTCUT_LABEL}
                </Kbd>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <Users size={32} color="var(--text-secondary)" />
              <Cpu
                size={16}
                color="var(--text-secondary)"
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  background: "var(--bg-color)",
                  borderRadius: "50%",
                  padding: "1px",
                }}
              />
            </div>
            <div style={{ textAlign: "left", flex: 1 }}>
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                }}
              >
                <span>{MODE_SELECTOR_CONTENT.AGENTS_MODE.TITLE}</span>
              </h3>
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.25rem",
                  fontFamily: "JetBrains Mono",
                }}
              >
                {MODE_SELECTOR_CONTENT.AGENTS_MODE.DESCRIPTION}
              </p>
            </div>
          </motion.div>
        </div>

        {showShortcutHints && (
          <motion.div
            variants={itemVariants}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              marginTop: "2rem",
              flexWrap: "wrap",
            }}
          >
            {showTemplatesHint && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--text-secondary)",
                  fontSize: "0.75rem",
                }}
              >
                <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-primary)]/70">
                  Ctrl + Shift + T
                </Kbd>
                <span>{MODE_SELECTOR_CONTENT.HINTS.TEMPLATES}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
              }}
            >
              <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-primary)]/70">
                Ctrl + T
              </Kbd>
              <span>{MODE_SELECTOR_CONTENT.HINTS.NEW_SPACE}</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
              }}
            >
              <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-primary)]/70">
                Ctrl + ,
              </Kbd>
              <span>{MODE_SELECTOR_CONTENT.HINTS.SETTINGS}</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});
