"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
export default function ChromeEffects() {
  const ref = useRef<HTMLDivElement>(null);
  const { ready } = usePortfolioMotion();
  useGSAP(() => {
    if (!ready) return;
    gsap.fromTo(ref.current, { scaleX: 0 }, { scaleX: 1, ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: true, invalidateOnRefresh: true } });
  }, { scope: ref, dependencies: [ready], revertOnUpdate: true });
  return <div ref={ref} className="scroll-progress" aria-hidden="true" />;
}
