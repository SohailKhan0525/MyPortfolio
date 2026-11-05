"use client";

import { stagger, useAnimate } from "motion/react";
import { useEffect } from "react";
import { usePortfolioMotion } from "./MotionPreferences";

export default function Template({ children }: { children: React.ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const { ready, reduced } = usePortfolioMotion();
  useEffect(() => {
    if (!scope.current || !ready) return;
    // Homepage sections have their own choreography. Other routes animate only
    // the small opening block, never the full page or its sticky/fixed ancestors.
    const targets = Array.from(scope.current.querySelectorAll<HTMLElement>(".resume-top, .not-found > h1, .not-found > p, .not-found > a"));
    if (!targets.length) return;
    targets.forEach(target => target.classList.add("route-heading-arrival"));
    const controls = animate(targets, { opacity: reduced ? 1 : [0.65, 1], y: reduced ? 0 : [22, 0] }, {
      duration: reduced ? 0 : 0.6, delay: reduced ? 0 : stagger(0.06), ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [ready, reduced, animate, scope]);
  return <div ref={scope} className="page-transition">{children}</div>;
}
