"use client";

import { useEffect, useState } from "react";
import { usePortfolioMotion } from "./MotionPreferences";

/** Replay a short study only while someone can see it. Pausing settles the art. */
export function useIllustrationPlayback(inView: boolean, cycleMs = 6400, subjectKey = 0) {
  const { ready, reduced } = usePortfolioMotion();
  const [pageVisible, setPageVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const active = ready && !reduced && inView && pageVisible && !paused;
  useEffect(() => {
    if (!active) return;
    setRun(current => current + 1);
    const timer = window.setInterval(() => setRun(current => current + 1), cycleMs);
    return () => window.clearInterval(timer);
  }, [active, cycleMs, subjectKey]);

  return {
    ready, reduced, paused, run,
    playing: active && run > 0,
    toggle: () => setPaused(current => !current),
  };
}
