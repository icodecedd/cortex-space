import { motion, Variants, AnimatePresence } from "framer-motion";
import { SPLASH_CONTENT } from "@/lib/content";

interface SplashScreenProps {
  splashKey: number;
  reducedMotion?: boolean;
}

export function SplashScreen({ splashKey, reducedMotion = false }: SplashScreenProps) {
  const containerVariants: Variants = {
    initial: { 
      opacity: 0, 
    },
    animate: { 
      opacity: 1, 
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: reducedMotion ? 1 : 1.05,
      filter: reducedMotion ? "none" : "blur(20px)",
      transition: {
        duration: 0.8,
        ease: [0.645, 0.045, 0.355, 1] as any
      }
    }
  };

  const titleVariants: Variants = {
    initial: { opacity: 0, y: 20, filter: "blur(10px)" },
    animate: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { 
        duration: 1.2, 
        ease: [0.22, 1, 0.36, 1] as any 
      }
    }
  };

  const subtitleVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 0.5, 
      y: 0,
      transition: { duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] as any }
    }
  };

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
    <div 
      className="flex-1 w-full relative flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      {/* Dynamic atmospheric glow */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] rounded-full blur-[150px] pointer-events-none" 
        style={{ 
          background: `radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)`,
        }}
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={splashKey}
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 flex flex-col items-center justify-center"
        >
          <motion.div variants={titleVariants} className="splash-text flex items-baseline">
            {SPLASH_CONTENT.TITLE}
            <span style={{ color: "var(--accent-primary)", marginLeft: "0.2em" }}>
              {SPLASH_CONTENT.SUBTITLE}
            </span>
          </motion.div>
          
          <motion.div 
            variants={subtitleVariants} 
            className="splash-subtext flex items-center gap-[4px]"
          >
            {SPLASH_CONTENT.AWAKENING}
            {!reducedMotion && (
              <div className="flex ml-1">
                <motion.span variants={dotVariants} animate="animate">.</motion.span>
                <motion.span variants={dotVariants} animate="animate" transition={{ delay: 0.2 }}>.</motion.span>
                <motion.span variants={dotVariants} animate="animate" transition={{ delay: 0.4 }}>.</motion.span>
              </div>
            )}
            {reducedMotion && <span>...</span>}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Subtle bottom scanline or hardware detail */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-t from-[var(--accent-primary)] to-transparent opacity-20" />
    </div>
  );
}
