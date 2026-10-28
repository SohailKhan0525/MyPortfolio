"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePortfolioMotion } from "./MotionPreferences";
import { useScrollActivity } from "./useScrollActivity";
import "./robot-companion.css";

// Three and its renderer stay out of the portfolio's initial JavaScript bundle.
const RobotScene = dynamic(() => import("./robot/RobotScene"), { ssr: false });

class RobotBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function RobotCompanion() {
  const host = useRef<HTMLElement>(null);
  const { ready, reduced } = usePortfolioMotion();
  const scrolling = useScrollActivity();
  const [nearby, setNearby] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const loaded = status === "ready";
  const failed = status === "fallback";
  // A late GPU callback must never replace an error fallback after unmount.
  const onReady = useCallback(() => setStatus(current => current === "fallback" ? current : "ready"), []);
  const onError = useCallback(() => setStatus("fallback"), []);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNearby(true); preload.disconnect(); }
    }, { rootMargin: "160px" });
    const visibility = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.15);
    }, { threshold: [0, 0.15] });
    const onVisibility = () => setPageVisible(!document.hidden);
    preload.observe(node);
    visibility.observe(node);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      preload.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const active = loaded && ready && !reduced && visible && pageVisible && !scrolling && !failed;

  return <figure ref={host} className="robot-companion" role="img"
    aria-label="Minty, a small mint-colored robot companion. It waves, explores, and occasionally takes a playful tumble."
    data-active={active} data-reduced={reduced} data-loaded={loaded} data-failed={failed} aria-busy={status === "loading"}>
    {/* Reserve the stage while loading, then reveal the actual prepared model.
        Never swap an unrelated still face/pose for the moving robot on reload. */}
    {failed && <img className="robot-poster" src="/models/minty-robot-still.webp" width="640" height="320" alt="" aria-hidden="true" />}
    {ready && nearby && !failed && <RobotBoundary onError={onError}>
      <RobotScene active={active} reduced={reduced} onReady={onReady} onError={onError} />
    </RobotBoundary>}
  </figure>;
}
