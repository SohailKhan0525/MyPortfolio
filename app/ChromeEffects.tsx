"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { useEffect, useState } from "react";

function IntroBoot() {
  const [show, setShow] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShow(false);
      return;
    }
    const timers = [
      window.setTimeout(() => setStep(1), 260),
      window.setTimeout(() => setStep(2), 620),
      window.setTimeout(() => setStep(3), 1000),
      window.setTimeout(() => setShow(false), 1550),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="intro-boot" initial={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(8px)" }} transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}>
          <div className="intro-boot-inner">
            <motion.span className="intro-mark" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>Q</motion.span>
            <div className="intro-lines" aria-hidden="true">
              <AnimatePresence>
                {step >= 1 && <motion.p key="l1" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>$ whoami</motion.p>}
                {step >= 2 && <motion.p key="l2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>Mohd Zaheer Uddin — building with AI, one project at a time.</motion.p>}
                {step >= 3 && <motion.p key="l3" className="intro-ready" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>portfolio ready.</motion.p>}
              </AnimatePresence>
            </div>
            <div className="intro-progress"><motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1] }} /></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

export default function ChromeEffects() {
  return (
    <>
      <IntroBoot />
      <ScrollProgress />
    </>
  );
}
