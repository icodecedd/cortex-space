import { motion, Variants, AnimatePresence } from "framer-motion";
import { SPLASH_CONTENT } from "@/lib/content";

interface SplashScreenProps {
  splashKey: number;
  reducedMotion?: boolean;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function SplashScreen({ splashKey, reducedMotion = false }: SplashScreenProps) {
  const skip = reducedMotion;

  const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: skip ? 0 : 0.12,
        delayChildren: skip ? 0 : 0.15,
      },
    },
    exit: {
      opacity: 0,
      scale: skip ? 1 : 1.03,
      filter: skip ? "none" : "blur(14px)",
      transition: { duration: 0.65, ease: [0.645, 0.045, 0.355, 1] as any },
    },
  };

  const itemVariants: Variants = {
    initial: skip
      ? { opacity: 0 }
      : { opacity: 0, y: 10, filter: "blur(6px)" },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.75, ease },
    },
  };

  const markVariants: Variants = {
    initial: { opacity: 0, scale: skip ? 1 : 0.55 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.55,
        ease: [0.34, 1.56, 0.64, 1] as any,
      },
    },
  };

  return (
    <div
      className="flex-1 w-full relative flex items-center justify-center overflow-hidden select-none"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border-color) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.5,
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Ambient center glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 480,
          height: 220,
          background:
            "radial-gradient(ellipse, color-mix(in srgb, var(--accent-primary) 10%, transparent) 0%, transparent 70%)",
          filter: "blur(48px)",
          borderRadius: "50%",
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={splashKey}
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 flex flex-col items-center"
          style={{ gap: "1.75rem" }}
        >
          {/* Ring mark */}
          <motion.div variants={markVariants}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1.5px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {skip ? (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--accent-primary)",
                    opacity: 0.9,
                  }}
                />
              ) : (
                <motion.div
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--accent-primary)",
                    boxShadow:
                      "0 0 10px 2px color-mix(in srgb, var(--accent-primary) 50%, transparent)",
                  }}
                />
              )}
            </div>
          </motion.div>

          {/* Wordmark */}
          <motion.div
            variants={itemVariants}
            style={{ display: "flex", alignItems: "baseline", gap: "0.18em" }}
          >
            <span
              style={{
                fontFamily: "Geist Variable, sans-serif",
                fontSize: "2.6rem",
                fontWeight: 700,
                letterSpacing: "-0.055em",
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {SPLASH_CONTENT.TITLE}
            </span>
            <span
              style={{
                fontFamily: "Geist Variable, sans-serif",
                fontSize: "2.6rem",
                fontWeight: 300,
                letterSpacing: "-0.055em",
                color: "var(--accent-primary)",
                lineHeight: 1,
                opacity: 0.85,
              }}
            >
              {SPLASH_CONTENT.SUBTITLE}
            </span>
          </motion.div>

          {/* Status row + progress */}
          <motion.div
            variants={itemVariants}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.85rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {skip ? (
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--accent-primary)",
                    opacity: 0.5,
                  }}
                />
              ) : (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--accent-primary)",
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.68rem",
                  fontWeight: 400,
                  letterSpacing: "0.14em",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                {SPLASH_CONTENT.AWAKENING}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: 140,
                height: 1,
                background: "var(--border-color)",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: skip ? 0.1 : 1.7,
                  delay: skip ? 0 : 0.9,
                  ease: [0.4, 0, 0.2, 1] as any,
                }}
                style={{
                  height: "100%",
                  background: "var(--accent-primary)",
                  transformOrigin: "left center",
                  borderRadius: 1,
                  opacity: 0.75,
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom edge signal */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          duration: skip ? 0.1 : 1.1,
          delay: skip ? 0 : 0.4,
          ease,
        }}
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, var(--accent-primary) 50%, transparent 100%)",
          opacity: 0.18,
          transformOrigin: "center",
        }}
      />
    </div>
  );
}
