import { motion } from "framer-motion";

interface SplashScreenProps {
  splashKey: number;
  reducedMotion?: boolean;
}

export function SplashScreen({ splashKey, reducedMotion = false }: SplashScreenProps) {
  const containerVariants = {
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
    <div style={{
      flex: 1,
      width: '100%',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <motion.div
        key={splashKey}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div variants={textVariants} className="splash-text">
          CORTEX<span style={{ color: "var(--accent-primary)" }}> SPACE</span>
        </motion.div>
        
        <motion.div 
          variants={textVariants} 
          className="splash-subtext"
          style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          AWAKENING SYSTEM
          {!reducedMotion && (
            <div style={{ display: 'flex', marginLeft: '4px' }}>
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
