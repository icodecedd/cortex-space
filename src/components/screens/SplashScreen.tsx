import { motion, Variants } from "framer-motion";
import { SPLASH_CONTENT } from "@/lib/content";

interface SplashScreenProps {
  splashKey: number;
  reducedMotion?: boolean;
}

export function SplashScreen({ splashKey, reducedMotion = false }: SplashScreenProps) {
  const containerVariants: Variants = {
    initial: { 
      opacity: 0, 
      scale: reducedMotion ? 1 : 0.98,
      filter: reducedMotion ? "none" : "blur(10px)"
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1] as any, // Quintic ease-out
        staggerChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: reducedMotion ? 1 : 1.02,
      filter: reducedMotion ? "none" : "blur(10px)",
      transition: {
        duration: 0.8,
        ease: [0.645, 0.045, 0.355, 1] as any // ease-in-out-cubic
      }
    }
  };

  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }
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
      {/* Deep, subtle background glow effect aligned with the theme accent */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full blur-[120px] pointer-events-none" 
        style={{ backgroundColor: "var(--accent-primary)", opacity: 0.15 }}
      />
      
      <motion.div
        key={splashKey}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10 flex flex-col items-center justify-center"
      >
        <motion.div variants={textVariants} className="splash-text">
          {SPLASH_CONTENT.TITLE}<span style={{ color: "var(--accent-primary)" }}> {SPLASH_CONTENT.SUBTITLE}</span>
        </motion.div>
        
        <motion.div 
          variants={textVariants} 
          className="splash-subtext flex items-center gap-[2px]"
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
    </div>
  );
}
