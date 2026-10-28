"use client";

import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Reveal } from "./MotionElements";
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
  const threshold = index / (milestones.length - 1);
  const activation = useTransform(progress, [Math.max(0, threshold - 0.12), Math.max(0.1, threshold)], [0, 1]);
  const scale = useTransform(activation, [0, 0.55, 1], [1, 1.08, 1]);

  return (
    <li className="learning-stop">
      <motion.span className="learning-node" style={{ scale: reduced ? 1 : scale }} aria-hidden="true">
        <motion.span className="learning-node-fill" style={{ opacity: reduced ? 1 : activation }} />
        <span className="learning-node-number">{number}</span>
      </motion.span>
      <Reveal className="learning-copy" sequence>
        <h3>{title}</h3>
        <p>{description}</p>
      </Reveal>
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
