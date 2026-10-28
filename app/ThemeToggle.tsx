"use client";

import { motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { usePortfolioMotion } from "./MotionPreferences";
import "./theme-motion.css";

type Theme = "light" | "dark";
const rays = [0, 45, 90, 135, 180, 225, 270, 315];

/** The control stays live during the color change, including on touch devices. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const current = useRef<Theme>("dark");
  const settling = useRef<number | null>(null);
  const maskId = useId();
  const { reduced } = usePortfolioMotion();
  const light = theme === "light";
  const next = light ? "dark" : "light";

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("portfolio-theme"); } catch {}
    const restored: Theme = saved === "light" ? "light" : "dark";
    current.current = restored;
    setTheme(restored);
    document.documentElement.dataset.theme = restored;
    return () => {
      if (settling.current !== null) window.clearTimeout(settling.current);
      delete document.documentElement.dataset.themeChanging;
    };
  }, []);

  const change = () => {
    const target = current.current === "dark" ? "light" : "dark";
    current.current = target;
    const root = document.documentElement;
    if (settling.current !== null) window.clearTimeout(settling.current);
    // Native root snapshots would cover the moving thumb until its animation ends.
    // Interpolate the visible surfaces instead; no browser-specific API is needed.
    if (!reduced) {
      root.dataset.themeChanging = "true";
      settling.current = window.setTimeout(() => {
        delete root.dataset.themeChanging;
        settling.current = null;
      }, 450);
    } else {
      delete root.dataset.themeChanging;
    }
    root.dataset.theme = target;
    setTheme(target);
    try { localStorage.setItem("portfolio-theme", target); } catch {}
  };

  const spring = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 340, damping: 24, mass: 0.8 };

  return (
    <motion.button
      type="button"
      className="theme-switch"
      data-sound
      data-theme-state={theme}
      aria-label={`Switch to ${next} mode`}
      aria-pressed={light}
      title={`Switch to ${next} mode`}
      onClick={change}
      whileTap={reduced ? undefined : { scale: 0.94 }}
      transition={spring}
    >
      <span className="theme-switch-track" aria-hidden="true">
        <svg className="theme-switch-guide theme-switch-guide-sun" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
        <svg className="theme-switch-guide theme-switch-guide-moon" viewBox="0 0 24 24" fill="none">
          <path d="M19 14.4A7.5 7.5 0 0 1 9.6 5a7.5 7.5 0 1 0 9.4 9.4Z" />
        </svg>
      </span>
      <motion.span
        className="theme-switch-thumb"
        aria-hidden="true"
        initial={false}
        animate={{ x: light ? 0 : 28 }}
        transition={spring}
      >
        <motion.svg viewBox="0 0 32 32" fill="none" initial={false}
          animate={{ rotate: light ? 0 : -25 }} transition={spring}>
          <defs>
            <mask id={maskId}>
              <rect width="32" height="32" fill="white" />
              <motion.circle cy="10" r="7" fill="black" initial={false}
                animate={{ cx: light ? 35 : 21 }} transition={spring} />
            </mask>
          </defs>
          <motion.circle cx="16" cy="16" fill="currentColor" mask={`url(#${maskId})`}
            initial={false} animate={{ r: light ? 5 : 8 }} transition={spring} />
          {rays.map((angle, index) => (
            <g key={angle} transform={`rotate(${angle} 16 16)`}>
              <motion.path d="M16 5v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                initial={false} animate={{ pathLength: light ? 1 : 0, opacity: light ? 1 : 0 }}
                transition={{ duration: reduced ? 0 : 0.24, delay: reduced || !light ? 0 : index * 0.025 }} />
            </g>
          ))}
          <motion.path d="M25 7v4m-2-2h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
            initial={false} animate={{ opacity: light ? 0 : 0.9, scale: light ? 0.3 : 1 }}
            style={{ transformBox: "view-box", originX: "25px", originY: "9px" }} transition={spring} />
        </motion.svg>
      </motion.span>
    </motion.button>
  );
}
