"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import "./learning-journey.css";

const milestones = [
  ["01", "Python foundations", "Core syntax, OOP, files, data structures"],
  ["02", "ML experiments", "Regression, classification, evaluation"],
  ["03", "Interactive apps", "Turning models into usable tools"],
  ["04", "Better engineering", "Responsive UI, deployment, accessibility"],
] as const;

/** The rail follows reading progress; every milestone stays in the document flow. */
export default function LearningJourney() {
  const target = useRef<HTMLDivElement>(null);
  const { ready, reduced } = usePortfolioMotion();

  useGSAP(() => {
    if (!target.current || !ready || reduced) return;
    const media = gsap.matchMedia();
    media.add({ wide: "(min-width: 60.001rem)", narrow: "(max-width: 60rem)" }, context => {
      const wide = context.conditions?.wide;
      const stops = gsap.utils.toArray<HTMLElement>(".learning-stop", target.current);
      const rail = target.current?.querySelector(wide
        ? ".learning-seam-horizontal span" : ".learning-seam-vertical span");
      if (!rail) return;
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: target.current,
          start: "top 76%",
          end: wide ? "bottom 38%" : "bottom 66%",
          scrub: 0.35,
          invalidateOnRefresh: true,
        },
      });
      timeline.fromTo(rail, wide ? { scaleX: 0 } : { scaleY: 0 },
        { ...(wide ? { scaleX: 1 } : { scaleY: 1 }), duration: 1 }, 0);
      stops.forEach((stop, index) => {
        const position = index / milestones.length;
        timeline.fromTo(stop.querySelector(".learning-node-fill"), { scaleY: 0 },
          { scaleY: 1, duration: 0.14 }, position);
        timeline.fromTo(stop.querySelector(".learning-copy"), { y: 16, opacity: 0.55 },
          { y: 0, opacity: 1, duration: 0.2 }, position);
        timeline.fromTo(stop.querySelector(".learning-step-rule"), { scaleX: 0 },
          { scaleX: 1, duration: 0.2 }, position);
      });
    });
    return () => media.revert();
  }, { scope: target, dependencies: [ready, reduced], revertOnUpdate: true });

  return (
    <div className="learning-journey" ref={target}>
      <div className="learning-seam learning-seam-horizontal" aria-hidden="true"><span /></div>
      <div className="learning-seam learning-seam-vertical" aria-hidden="true"><span /></div>
      <ol className="learning-stops">
        {milestones.map(([number, title, description]) => (
          <li className="learning-stop" key={number}>
            <span className="learning-node" aria-hidden="true">
              <span className="learning-node-fill" />
              <span className="learning-node-number">{number}</span>
            </span>
            <div className="learning-copy">
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="learning-step-rule" aria-hidden="true" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
