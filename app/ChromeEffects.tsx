"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 32, restDelta: 0.001 });
  return <motion.div className="scroll-progress" style={{ scaleX: reduced ? scrollYProgress : scaleX }} aria-hidden="true" />;
}

export default function ChromeEffects() {
  return (
    <>
      <ScrollProgress />
    </>
  );
}
