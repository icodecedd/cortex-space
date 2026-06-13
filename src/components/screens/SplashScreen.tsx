import { motion, Variants, AnimatePresence } from "framer-motion";
import { SPLASH_CONTENT } from "@/lib/content";
import { useState, useEffect, memo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ScrambleText — resolves from random glyph noise to the real string
// ─────────────────────────────────────────────────────────────────────────────

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#";

const ScrambleText = memo(function ScrambleText({
  text,
  startDelay = 0,
  duration = 600,
  style,
}: {
  text: string;
  startDelay?: number;
  duration?: number;
  style?: React.CSSProperties;
}) {
  const [output, setOutput] = useState(() =>
    text.replace(/[^\s]/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
  );

  useEffect(() => {
    let alive = true;
    const outer = setTimeout(() => {
      if (!alive) return;
      const t0 = Date.now();
      const id = setInterval(() => {
        if (!alive) { clearInterval(id); return; }
        const p = Math.min((Date.now() - t0) / duration, 1);
        const locked = Math.floor(p * text.length);
        setOutput(
          text
            .split("")
            .map((ch, i) =>
              i < locked || ch === " "
                ? ch
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            )
            .join("")
        );
        if (p >= 1) { setOutput(text); clearInterval(id); }
      }, 40);
    }, startDelay);
    return () => { alive = false; clearTimeout(outer); };
  }, [text, startDelay, duration]);

  return <span style={style}>{output}</span>;
});

// ─────────────────────────────────────────────────────────────────────────────
// PulseRing — single expanding ring, memoized
// ─────────────────────────────────────────────────────────────────────────────

const PulseRing = memo(function PulseRing({ delay }: { delay: number }) {
  return (
    <motion.div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 56,
        height: 56,
        marginTop: -28,
        marginLeft: -28,
        borderRadius: "50%",
        border: "1px solid var(--accent-primary)",
        pointerEvents: "none",
        willChange: "transform, opacity",
      }}
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: 5.5, opacity: 0 }}
      transition={{ duration: 2.1, delay, ease: [0.16, 1, 0.3, 1] as any }}
    />
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Reticle — 4-corner bracket targeting mark, pure CSS
// ─────────────────────────────────────────────────────────────────────────────

function Reticle({ size = 28 }: { size?: number }) {
  const b = "1.5px solid var(--accent-primary)";
  const c = Math.round(size * 0.32);
  const pos: React.CSSProperties = { position: "absolute", width: c, height: c };
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ ...pos, top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <div style={{ ...pos, top: 0, right: 0, borderTop: b, borderRight: b }} />
      <div style={{ ...pos, bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <div style={{ ...pos, bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 4,
          height: 4,
          marginTop: -2,
          marginLeft: -2,
          borderRadius: "50%",
          background: "var(--accent-primary)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SplashScreen
// ─────────────────────────────────────────────────────────────────────────────

interface SplashScreenProps {
  splashKey: number;
  reducedMotion?: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function SplashScreen({ splashKey, reducedMotion = false }: SplashScreenProps) {
  const skip = reducedMotion;

  const container: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: skip ? 0 : 0.1,
        delayChildren: skip ? 0 : 0.15,
      },
    },
    exit: {
      opacity: 0,
      scale: skip ? 1 : 1.04,
      filter: skip ? "none" : "blur(14px)",
      transition: { duration: 0.6, ease: [0.645, 0.045, 0.355, 1] as any },
    },
  };

  const fadeUp: Variants = {
    initial: { opacity: 0, y: skip ? 0 : 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: EASE },
    },
  };

  const reticleVariants: Variants = {
    initial: { opacity: 0, scale: 0.65, rotate: skip ? 0 : -30 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] as any },
    },
  };

  return (
    <div
      className="flex-1 w-full relative flex items-center justify-center overflow-hidden select-none"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      {/* Pulse rings — sonar / neural signal */}
      {!skip && (
        <>
          <PulseRing delay={0.2} />
          <PulseRing delay={0.6} />
          <PulseRing delay={1.0} />
        </>
      )}

      {/* Ambient center glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8 }}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 380,
          height: 190,
          background:
            "radial-gradient(ellipse, color-mix(in srgb, var(--accent-primary) 9%, transparent) 0%, transparent 70%)",
          filter: "blur(56px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={splashKey}
          variants={container}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          {/* Reticle — locks in from slight rotation */}
          <motion.div variants={reticleVariants}>
            <Reticle size={28} />
          </motion.div>

          {/* Wordmark */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            {/* Primary title — scramble resolves */}
            <div
              style={{
                fontFamily: "Geist Variable, sans-serif",
                fontSize: "2.8rem",
                fontWeight: 800,
                letterSpacing: "-0.06em",
                lineHeight: 1,
                color: "var(--text-primary)",
              }}
            >
              {skip ? (
                SPLASH_CONTENT.TITLE
              ) : (
                <ScrambleText
                  text={SPLASH_CONTENT.TITLE}
                  startDelay={280}
                  duration={550}
                />
              )}
            </div>

            {/* Subtitle — wide-tracked, accent, lower weight */}
            <div
              style={{
                fontFamily: "Geist Variable, sans-serif",
                fontSize: "0.72rem",
                fontWeight: 400,
                letterSpacing: "0.5em",
                textTransform: "uppercase",
                color: "var(--accent-primary)",
                opacity: 0.75,
                paddingLeft: "0.5em", // optical compensation for tracking
              }}
            >
              {SPLASH_CONTENT.SUBTITLE}
            </div>
          </motion.div>

          {/* Boot status line */}
          <motion.div variants={fadeUp}>
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.1em",
                color: "var(--text-secondary)",
                opacity: 0.55,
              }}
            >
              {skip ? (
                `> ${SPLASH_CONTENT.AWAKENING}`
              ) : (
                <ScrambleText
                  text={`> ${SPLASH_CONTENT.AWAKENING}`}
                  startDelay={660}
                  duration={460}
                />
              )}
            </div>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            variants={fadeUp}
            style={{
              width: 110,
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
                duration: skip ? 0.1 : 1.55,
                delay: skip ? 0 : 0.82,
                ease: [0.4, 0, 0.2, 1] as any,
              }}
              style={{
                height: "100%",
                background: "var(--accent-primary)",
                transformOrigin: "left center",
                opacity: 0.65,
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom edge signal — draws in from center */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          duration: skip ? 0.1 : 1.0,
          delay: skip ? 0 : 0.3,
          ease: EASE,
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, var(--accent-primary) 50%, transparent 100%)",
          opacity: 0.15,
          transformOrigin: "center",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
