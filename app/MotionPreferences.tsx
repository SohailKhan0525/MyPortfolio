"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const MotionPreferences = createContext({ reduced: true, ready: false });
export const usePortfolioMotion = () => useContext(MotionPreferences);

export default function PortfolioMotionProvider({ children }: { children: ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(true);
  const [ready, setReady] = useState(false);
  const reduced = !ready || systemReduced;

  useEffect(() => {
    // The removed navbar control must not leave a visitor permanently paused.
    try { localStorage.removeItem("portfolio-motion"); } catch {}
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    setReady(true);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  const value = useMemo(() => ({ reduced, ready }), [reduced, ready]);

  return <MotionPreferences.Provider value={value}>
    {children}
  </MotionPreferences.Provider>;
}
