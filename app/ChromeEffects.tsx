"use client";

import { motion, useScroll } from "motion/react";

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  // Match native scroll immediately instead of keeping a spring running behind it.
  return <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}

export default function ChromeEffects() {
  return (
    <>
      <ScrollProgress />
    </>
  );
}
