"use client";

import { MotionConfig, useReducedMotion } from "motion/react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const MotionPreferences = createContext({ reduced: true, ready: false });
export const usePortfolioMotion = () => useContext(MotionPreferences);

export default function PortfolioMotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useReducedMotion() === true;
  const [ready, setReady] = useState(false);
  const reduced = !ready || systemReduced;

  useEffect(() => {
    // The removed navbar control must not leave a visitor permanently paused.
    try { localStorage.removeItem("portfolio-motion"); } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  const value = useMemo(() => ({ reduced, ready }), [reduced, ready]);

  return <MotionPreferences.Provider value={value}>
    <MotionConfig reducedMotion={reduced ? "always" : "user"} transition={{ type: "spring", stiffness: 400, damping: 36 }}>
      {children}
    </MotionConfig>
  </MotionPreferences.Provider>;
}
