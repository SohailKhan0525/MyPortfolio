"use client";

import { motion, useAnimate, useInView, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { usePortfolioMotion } from "./MotionPreferences";
import "./learning-journey.css";

const milestones = [
  ["01", "Python foundations", "Core syntax, OOP, files, data structures"],
  ["02", "ML experiments", "Regression, classification, evaluation"],
  ["03", "Interactive apps", "Turning models into usable tools"],
  ["04", "Better engineering", "Responsive UI, deployment, accessibility"],
] as const;

function LearningStop({ milestone, index, progress, reduced }: {
  milestone: typeof milestones[number];
  index: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const [number, title, description] = milestone;
  const item = useRef<HTMLLIElement>(null);
  const [copy, animateCopy] = useAnimate<HTMLDivElement>();
  const inView = useInView(item, { once: true, amount: 0.5 });
  const threshold = index / (milestones.length - 1);
  const activation = useTransform(progress, [Math.max(0, threshold - 0.12), Math.max(0.1, threshold)], [0, 1]);
  const scale = useTransform(activation, [0, 0.55, 1], [1, 1.08, 1]);

  useEffect(() => {
    if (!copy.current || (!inView && !reduced)) return;
    // Start from complete server-rendered content; motion is an enhancement.
    const animation = reduced
      ? animateCopy(copy.current, { opacity: 1, y: 0 }, { duration: 0 })
      : animateCopy(copy.current, { opacity: [0.66, 1], y: [14, 0] }, {
        delay: index * 0.06,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      });
    return () => animation.stop();
  }, [animateCopy, copy, inView, index, reduced]);

  return (
    <li className="learning-stop" ref={item}>
      <motion.span className="learning-node" style={{ scale: reduced ? 1 : scale }} aria-hidden="true">
        <motion.span className="learning-node-fill" style={{ opacity: reduced ? 1 : activation }} />
        <span className="learning-node-number">{number}</span>
      </motion.span>
      <div className="learning-copy" ref={copy}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </li>
  );
}

export default function LearningJourney() {
  const target = useRef<HTMLDivElement>(null);
  const { reduced } = usePortfolioMotion();
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start 80%", "end 45%"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="learning-journey" ref={target}>
      <div className="learning-seam learning-seam-horizontal" aria-hidden="true">
        <motion.span style={{ scaleX: reduced ? 1 : progress }} />
      </div>
      <div className="learning-seam learning-seam-vertical" aria-hidden="true">
        <motion.span style={{ scaleY: reduced ? 1 : progress }} />
      </div>
      <ol className="learning-stops">
        {milestones.map((milestone, index) => (
          <LearningStop key={milestone[0]} milestone={milestone} index={index} progress={progress} reduced={reduced} />
        ))}
      </ol>
    </div>
  );
}
