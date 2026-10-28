"use client";

import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { Pause, Play } from "@phosphor-icons/react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const MotionPreferences = createContext({ reduced: true, systemReduced: false, toggle: () => {} });
export const usePortfolioMotion = () => useContext(MotionPreferences);

export default function PortfolioMotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useReducedMotion() === true;
  const [manualReduced, setManualReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = !ready || systemReduced || manualReduced;

  useEffect(() => {
    try { setManualReduced(localStorage.getItem("portfolio-motion") === "reduced"); } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  const value = useMemo(() => ({
    reduced,
    systemReduced,
    toggle: () => {
      if (systemReduced) return;
      setManualReduced(current => {
        const next = !current;
        try { localStorage.setItem("portfolio-motion", next ? "reduced" : "full"); } catch {}
        return next;
      });
    },
  }), [reduced, systemReduced]);

  return <MotionPreferences.Provider value={value}>
    <MotionConfig reducedMotion={reduced ? "always" : "user"} transition={{ type: "spring", stiffness: 400, damping: 36 }}>
      {children}
    </MotionConfig>
  </MotionPreferences.Provider>;
}

export function MotionToggle() {
  const { reduced, systemReduced, toggle } = usePortfolioMotion();
  const label = systemReduced ? "Reduced motion follows your device setting" : reduced ? "Enable animations" : "Reduce animations";
  return <motion.button type="button" className="icon-button motion-toggle" onClick={toggle}
    aria-label={label} title={label} aria-pressed={reduced} aria-disabled={systemReduced}
    whileTap={reduced ? undefined : { scale: 0.92 }}>
    {reduced ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
  </motion.button>;
}
