"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import "./learning-journey.css";

const milestones = [
  ["01", "Python foundations", "Core syntax, OOP, files, data structures"],
  ["02", "ML experiments", "Regression, classification, evaluation"],
  ["03", "Interactive apps", "Turning models into usable tools"],
  ["04", "Better engineering", "Responsive UI, deployment, accessibility"],
] as const;

export default function LearningJourney() {
  const target = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
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
        {milestones.map(([number, title, description]) => (
          <li className="learning-stop" key={number}>
            <span className="learning-node" aria-hidden="true">{number}</span>
            <div className="learning-copy">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
