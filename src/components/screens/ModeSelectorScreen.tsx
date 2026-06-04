import { Terminal, Users, Cpu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Mode } from "@/types";
import { setSetting } from "@/lib/store";
import { useEffect } from "react";
import { Kbd } from "@/components/ui/kbd";

interface ModeSelectorScreenProps {
  onSelectMode: (mode: Mode) => void;
  showShortcutHints?: boolean;
  showTemplatesHint?: boolean;
}

export function ModeSelectorScreen({ onSelectMode, showShortcutHints = true, showTemplatesHint = true }: ModeSelectorScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleSelectMode = async (mode: Mode) => {
    await setSetting("startup.lastMode", mode);
    onSelectMode(mode);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === "n") {
        e.preventDefault();
        handleSelectMode("normal");
      } else if (e.ctrlKey && key === "a") {
        e.preventDefault();
        handleSelectMode("agents");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
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
              src="/cortex-logo (2).png"
              alt="Cortex Logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.src = "/tauri.svg";
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
              CORTEX<span style={{ color: "var(--accent-primary)" }}> SPACE</span>
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
              THE COMMAND CENTER FOR YOUR AGENTS AND TERMINAL WORKFLOWS
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
            Select your operational workflow.
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
            }}
          >
            {showShortcutHints && <Kbd className="absolute top-4 right-4 bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-normal text-[10px]">Ctrl + N</Kbd>}
            <Terminal size={32} color="var(--text-secondary)" />
            <div style={{ textAlign: "left", flex: 1 }}>
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.1rem",
                  letterSpacing: "0.1em",
                  color: "var(--text-primary)",
                }}
              >
                <span>NORMAL MODE</span>
              </h3>
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.25rem",
                  fontFamily: "JetBrains Mono",
                }}
              >
                MANUAL CONTROL OVER MULTIPLE TERMINAL PANES
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
            }}
          >
            {showShortcutHints && <Kbd className="absolute top-4 right-4 bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-normal text-[10px]">Ctrl + A</Kbd>}
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
                  letterSpacing: "0.1em",
                  color: "var(--text-primary)",
                }}
              >
                <span>AGENTS MODE</span>
              </h3>
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.25rem",
                  fontFamily: "JetBrains Mono",
                }}
              >
                AI AGENTS ASSISTING AND COORDINATING YOUR WORKSPACE
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
                <span>Templates</span>
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
              <span>New Space</span>
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
              <span>Settings</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
