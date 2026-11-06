"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gsap, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";

/** Observe the stationary drawing, not its animated children. No frame updates
 * cross React's boundary, and hidden/offscreen diagrams consume no animation work. */
export function useIllustrationPlayback(target: RefObject<Element | null>) {
  const { ready, reduced } = usePortfolioMotion();
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    const node = target.current;
    const observer = node && typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.12 })
      : null;
    if (node) observer?.observe(node);
    if (!observer) setInView(true);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [target]);

  const toggle = useCallback(() => setPaused(current => !current), []);
  return { ready, reduced, paused, playing: ready && !reduced && inView && pageVisible && !paused, toggle };
}

/** One reversible GSAP context owns each scene, including repeat delays.
 * A deliberate pause settles the diagram; leaving the viewport only suspends it. */
export function useIllustrationTimeline<T extends Element>(
  target: RefObject<T | null>,
  create: (node: T) => gsap.core.Timeline,
  subjectKey = 0,
) {
  const playback = useIllustrationPlayback(target);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const { ready, reduced, playing, paused } = playback;

  useGSAP(() => {
    if (!ready || reduced || !target.current) return;
    timeline.current = create(target.current);
    return () => { timeline.current = null; };
  }, { scope: target, dependencies: [ready, reduced, subjectKey, create], revertOnUpdate: true });

  useEffect(() => {
    const current = timeline.current;
    if (!current) return;
    if (paused) current.pause().progress(1);
    else if (playing) {
      if (current.time() >= current.duration()) current.restart();
      else current.play();
    } else current.pause();
  }, [playing, paused, ready, reduced, subjectKey]);

  return playback;
}
