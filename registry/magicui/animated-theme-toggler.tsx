"use client";

/**
 * Adapted from Magic UI AnimatedThemeToggler:
 * https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/animated-theme-toggler.tsx
 * Upstream blob: a4185ec5c7d33f56d38c7269a7439ede7cd081b8
 * Portfolio adaptations: data-theme, existing persistence, Motion icon, mobile fallback.
 *
 * MIT License
 * 
 * Copyright (c) Magic UI
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { Moon, Sun } from "@phosphor-icons/react";
import "./animated-theme-toggler.css";

export type TransitionVariant = "circle" | "square" | "triangle" | "diamond" | "hexagon" | "rectangle" | "star";
type Theme = "light" | "dark";

interface AnimatedThemeTogglerProps extends Omit<HTMLMotionProps<"button">, "children"> {
  duration?: number;
  variant?: TransitionVariant;
  fromCenter?: boolean;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  reduceMotion?: boolean;
}

function polygonCollapsed(point: string, vertexCount: number): string {
  const pairs = Array.from({ length: vertexCount }, () => point).join(", ")
  return `polygon(${pairs})`
}

// All coordinates are percentages of the snapshot reference box: Chrome 150
// renders absolute px clip-path coordinates on ::view-transition-new(root)
// unscaled on fractional display scales (e.g. Windows 150%) for the first
// transition after load, so px values land at the wrong position (#989).
function getThemeTransitionClipPaths(
  variant: TransitionVariant,
  cx: number,
  cy: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number
): [string, string] {
  const toX = (x: number) => `${(x / viewportWidth) * 100}%`
  const toY = (y: number) => `${(y / viewportHeight) * 100}%`
  const point = (x: number, y: number) => `${toX(x)} ${toY(y)}`
  // circle() percentage radii resolve against hypot(w, h) / sqrt(2) of the reference box.
  const toRadius = (r: number) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`

  switch (variant) {
    case "circle":
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ]
    case "square": {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const halfSide = Math.max(halfW, halfH) * 1.05
      const end = [
        point(cx - halfSide, cy - halfSide),
        point(cx + halfSide, cy - halfSide),
        point(cx + halfSide, cy + halfSide),
        point(cx - halfSide, cy + halfSide),
      ].join(", ")
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`]
    }
    case "triangle": {
      const scale = maxRadius * 2.2
      const dx = (Math.sqrt(3) / 2) * scale
      const verts = [
        point(cx, cy - scale),
        point(cx + dx, cy + 0.5 * scale),
        point(cx - dx, cy + 0.5 * scale),
      ].join(", ")
      return [polygonCollapsed(point(cx, cy), 3), `polygon(${verts})`]
    }
    case "diamond": {
      // Slightly larger than the view-transition circle radius so axis-aligned coverage matches the circle reveal.
      const R = maxRadius * Math.SQRT2
      const end = [
        point(cx, cy - R),
        point(cx + R, cy),
        point(cx, cy + R),
        point(cx - R, cy),
      ].join(", ")
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`]
    }
    case "hexagon": {
      const R = maxRadius * Math.SQRT2
      const verts: string[] = []
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3
        verts.push(point(cx + R * Math.cos(a), cy + R * Math.sin(a)))
      }
      return [
        polygonCollapsed(point(cx, cy), 6),
        `polygon(${verts.join(", ")})`,
      ]
    }
    case "rectangle": {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const end = [
        point(cx - halfW, cy - halfH),
        point(cx + halfW, cy - halfH),
        point(cx + halfW, cy + halfH),
        point(cx - halfW, cy + halfH),
      ].join(", ")
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`]
    }
    case "star": {
      // Small overscan so the last frames never leave a 1px seam before the transition group ends.
      const R = maxRadius * Math.SQRT2 * 1.03
      const innerRatio = 0.42
      const starPolygon = (radius: number) => {
        const verts: string[] = []
        for (let i = 0; i < 5; i++) {
          const outerA = -Math.PI / 2 + (i * 2 * Math.PI) / 5
          verts.push(
            point(
              cx + radius * Math.cos(outerA),
              cy + radius * Math.sin(outerA)
            )
          )
          const innerA = outerA + Math.PI / 5
          verts.push(
            point(
              cx + radius * innerRatio * Math.cos(innerA),
              cy + radius * innerRatio * Math.sin(innerA)
            )
          )
        }
        return `polygon(${verts.join(", ")})`
      }
      const startR = Math.max(2, R * 0.025)
      return [starPolygon(startR), starPolygon(R)]
    }
    default:
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ]
  }
}


export function AnimatedThemeToggler({
  className = "",
  duration = 650,
  variant = "circle",
  fromCenter = false,
  theme,
  onThemeChange,
  reduceMotion,
  onClick,
  ...props
}: AnimatedThemeTogglerProps) {
  const isControlled = theme !== undefined;
  const [internalTheme, setInternalTheme] = useState<Theme>("dark");
  const activeTheme = theme ?? internalTheme;
  const themeRef = useRef<Theme>(activeTheme);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const transitioning = useRef(false);
  const transitionRef = useRef<ViewTransition | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const fallbackTimer = useRef<number | null>(null);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [iconRun, setIconRun] = useState(0);
  const systemReduced = useReducedMotion();
  const reduced = reduceMotion ?? systemReduced === true;

  useEffect(() => { themeRef.current = activeTheme; }, [activeTheme]);

  const clearStyles = useCallback(() => {
    const root = document.documentElement;
    delete root.dataset.magicuiThemeVt;
    delete root.dataset.magicuiThemeFallback;
    root.style.removeProperty("--magicui-theme-toggle-vt-duration");
    root.style.removeProperty("--magicui-theme-vt-clip-from");
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!isControlled) {
      let saved: string | null = null;
      try { saved = localStorage.getItem("portfolio-theme"); } catch {}
      const restored = saved === "light" ? "light" : "dark";
      themeRef.current = restored;
      setInternalTheme(restored);
      document.documentElement.dataset.theme = restored;
    }
    return () => {
      mounted.current = false;
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
      transitionRef.current?.skipTransition();
      animationRef.current?.cancel();
      clearStyles();
    };
  }, [isControlled, clearStyles]);

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    const root = document.documentElement;
    // Use upstream's single-flight guard: rapid taps cannot create competing snapshots.
    if (!button || transitioning.current || root.dataset.magicuiThemeVt === "active") return;
    const next: Theme = themeRef.current === "dark" ? "light" : "dark";
    let committed = false;
    const applyTheme = () => {
      if (committed || !mounted.current) return;
      committed = true;
      themeRef.current = next;
      root.dataset.theme = next;
      delete root.dataset.themeDirection;
      if (isControlled) onThemeChange?.(next);
      else {
        setInternalTheme(next);
        try { localStorage.setItem("portfolio-theme", next); } catch {}
      }
    };
    const playIcon = () => {
      if (mounted.current) setIconRun(run => run + 1);
    };
    const fallback = () => {
      if (!reduced) root.dataset.magicuiThemeFallback = "active";
      applyTheme();
      playIcon();
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(() => {
        delete root.dataset.magicuiThemeFallback;
        fallbackTimer.current = null;
      }, 450);
    };
    if (reduced || typeof document.startViewTransition !== "function") {
      fallback();
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const { top, left, width, height } = button.getBoundingClientRect();
    const x = fromCenter ? viewportWidth / 2 : left + width / 2;
    const y = fromCenter ? viewportHeight / 2 : top + height / 2;
    const maxRadius = Math.hypot(Math.max(x, viewportWidth - x), Math.max(y, viewportHeight - y));
    const clipPath = getThemeTransitionClipPaths(variant, x, y, maxRadius, viewportWidth, viewportHeight);

    root.dataset.magicuiThemeVt = "active";
    root.style.setProperty("--magicui-theme-toggle-vt-duration", `${duration}ms`);
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);
    transitioning.current = true;
    setBusy(true);
    const cleanup = () => {
      animationRef.current?.cancel();
      animationRef.current = null;
      transitionRef.current = null;
      transitioning.current = false;
      clearStyles();
      if (mounted.current) {
        setBusy(false);
        playIcon();
      }
    };

    try {
      const transition = document.startViewTransition(() => flushSync(applyTheme));
      transitionRef.current = transition;
      transition.finished.finally(cleanup).catch(() => {});
      transition.ready.then(() => {
        if (!mounted.current || transitionRef.current !== transition) return;
        animationRef.current = root.animate(
          { clipPath },
          {
            duration,
            easing: variant === "star" ? "linear" : "cubic-bezier(.22,1,.36,1)",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      }).catch(() => {
        // Some mobile browsers expose the API but cannot capture this document.
        transition.skipTransition();
        applyTheme();
      });
    } catch {
      cleanup();
      fallback();
    }
  }, [clearStyles, duration, fromCenter, isControlled, onThemeChange, reduced, variant]);

  return (
    <motion.button {...props} ref={buttonRef} type="button"
      className={`magicui-theme-toggler ${className}`}
      aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={activeTheme === "light"}
      aria-busy={busy}
      title={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
      data-theme-state={activeTheme}
      data-sound
      onClick={event => { onClick?.(event); if (!event.defaultPrevented) toggleTheme(); }}
      whileTap={reduced ? undefined : { scale: 0.88 }}
      whileHover={reduced ? undefined : { scale: 1.06 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <motion.span key={`${activeTheme}-${iconRun}`} className="magicui-theme-icon" aria-hidden="true"
        initial={iconRun === 0 ? false : { opacity: 0.3, rotate: reduced ? 0 : -90, scale: reduced ? 1 : 0.7 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: reduced ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {activeTheme === "dark" ? <Sun size={22} weight="regular" /> : <Moon size={22} weight="regular" />}
      </motion.span>
    </motion.button>
  );
}

