"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { ready, reduced } = usePortfolioMotion();
  useGSAP(() => {
    if (!ready || reduced || !ref.current) return;
    const nodes = ref.current.querySelectorAll(".resume-top, .not-found > h1, .not-found > p, .not-found > a");
    if (nodes.length) gsap.fromTo(nodes, { y: 24, opacity: .6 }, { y: 0, opacity: 1, duration: .8, stagger: .07, ease: "power3.out", clearProps: "transform,opacity" });
  }, { scope: ref, dependencies: [ready, reduced], revertOnUpdate: true });
  return <div ref={ref} className="page-transition">{children}</div>;
}
