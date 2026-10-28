"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePortfolioMotion } from "./MotionPreferences";
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
  const { ready, reduced } = usePortfolioMotion();
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [pageVisible, setPageVisible] = useState(true);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const loaded = status === "ready";
  const failed = status === "fallback";
  // A late GPU callback must never replace an error fallback after unmount.
  const onReady = useCallback(() => setStatus(current => current === "fallback" ? current : "ready"), []);
  const onError = useCallback(() => setStatus("fallback"), []);

  useEffect(() => {
    // Escape the page's transforms, clipping and stacking contexts. A fixed
    // companion belongs to the viewport, even while the hero scrolls away.
    setPortalHost(document.body);
    const onVisibility = () => setPageVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const active = loaded && ready && !reduced && pageVisible;
  if (!portalHost) return null;

  return createPortal(<figure className="robot-companion" role="img"
    aria-label="Minty, a small mint-colored robot companion. It waves, explores, and occasionally takes a playful tumble."
    data-active={active} data-reduced={reduced} data-loaded={loaded} data-failed={failed} aria-busy={status === "loading"}>
    {/* Keep the fixed stage transparent until the actual model is prepared.
        Never swap an unrelated still face/pose for the moving robot on reload. */}
    {failed && <img className="robot-poster" src="/models/minty-robot-still.webp" width="640" height="320" alt="" aria-hidden="true" />}
    {ready && !failed && <RobotBoundary onError={onError}>
      <RobotScene active={active} reduced={reduced} onReady={onReady} onError={onError} />
    </RobotBoundary>}
  </figure>, portalHost);
}
