"use client";

/**
 * Adapted from Magic UI AnimatedThemeToggler:
 * https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/animated-theme-toggler.tsx
 * Upstream blob: a4185ec5c7d33f56d38c7269a7439ede7cd081b8
 * Portfolio adaptation: data-theme persistence and GSAP-only palette/icon transitions.
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

import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { gsap, useGSAP } from "../../app/gsap";
import { applyDocumentTheme, DEFAULT_THEME, readThemePreference, THEME_STORAGE_KEY, type Theme } from "../../app/theme-preference";

export type TransitionVariant = "circle" | "square" | "triangle" | "diamond" | "hexagon" | "rectangle" | "star";

interface AnimatedThemeTogglerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  duration?: number;
  /** Retained for registry API compatibility; GSAP now animates the actual palette. */
  variant?: TransitionVariant;
  fromCenter?: boolean;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  reduceMotion?: boolean;
}

const paletteKeys = ["--bg", "--surface", "--surface-2", "--surface-3", "--text", "--muted", "--text2", "--line", "--line-strong", "--signal", "--signal-soft", "--accent", "--header-bg"] as const;

/** Real CSS tokens interpolate together: no screenshot overlay or native animation engine. */
export function AnimatedThemeToggler({
  className = "", duration = 650, variant: _variant, fromCenter: _fromCenter,
  theme, onThemeChange, reduceMotion, onClick, onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, ...props
}: AnimatedThemeTogglerProps) {
  const [internalTheme, setInternalTheme] = useState<Theme>(DEFAULT_THEME);
  const [systemReduced, setSystemReduced] = useState(true);
  const activeTheme = theme ?? internalTheme;
  const themeRef = useRef<Theme>(activeTheme);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const paletteTween = useRef<gsap.core.Tween | null>(null);
  const previousInline = useRef<Map<string, string>>(new Map());
  const reduced = reduceMotion ?? systemReduced;

  const clearPalette = useCallback(() => {
    paletteTween.current?.kill();
    paletteTween.current = null;
    const root = document.documentElement;
    previousInline.current.forEach((value, key) => value ? root.style.setProperty(key, value) : root.style.removeProperty(key));
    previousInline.current.clear();
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (theme !== undefined) { themeRef.current = theme; return; }
    const restored = readThemePreference();
    themeRef.current = restored;
    setInternalTheme(restored);
    applyDocumentTheme(restored);
  }, [theme]);

  useEffect(() => {
    if (reduced) {
      clearPalette();
      if (buttonRef.current) { gsap.killTweensOf(buttonRef.current); gsap.set(buttonRef.current, { scale: 1 }); }
    }
    return clearPalette;
  }, [reduced, clearPalette]);

  useEffect(() => {
    const button = buttonRef.current;
    return () => { if (button) gsap.killTweensOf(button); };
  }, []);

  useGSAP(() => {
    const dark = activeTheme === "dark";
    gsap.to(".theme-icon-sun", { opacity: dark ? 1 : 0, rotation: dark ? 0 : 90, scale: dark ? 1 : 0.55, duration: reduced ? 0 : 0.5, ease: "power3.out", overwrite: true });
    gsap.to(".theme-icon-moon", { opacity: dark ? 0 : 1, rotation: dark ? -80 : 0, scale: dark ? 0.55 : 1, duration: reduced ? 0 : 0.5, ease: "power3.out", overwrite: true });
  }, { scope: buttonRef, dependencies: [activeTheme, reduced], revertOnUpdate: true });

  const toggleTheme = () => {
    const root = document.documentElement;
    const next: Theme = themeRef.current === "dark" ? "light" : "dark";
    const current = getComputedStyle(root);
    const from = Object.fromEntries(paletteKeys.map(key => [key, current.getPropertyValue(key).trim()]));
    clearPalette();
    applyDocumentTheme(next);
    themeRef.current = next;
    if (theme !== undefined) onThemeChange?.(next);
    else {
      setInternalTheme(next);
      try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
    }
    if (reduced) return;
    const destination = getComputedStyle(root);
    const to = Object.fromEntries(paletteKeys.map(key => [key, destination.getPropertyValue(key).trim()]));
    paletteKeys.forEach(key => previousInline.current.set(key, root.style.getPropertyValue(key)));
    gsap.set(root, from);
    paletteTween.current = gsap.to(root, { ...to, duration: Math.min(0.8, Math.max(0.15, duration / 1000)), ease: "power2.inOut", onComplete: clearPalette });
  };

  const press = (scale: number) => {
    if (!reduced && buttonRef.current) gsap.to(buttonRef.current, { scale, duration: 0.22, ease: "power3.out", overwrite: true });
  };

  return <button {...props} ref={buttonRef} type="button"
    className={`magicui-theme-toggler ${className}`}
    aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
    aria-pressed={activeTheme === "dark"}
    title={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
    data-theme-state={activeTheme} data-reduced-motion={reduced} data-sound
    onClick={event => { onClick?.(event); if (!event.defaultPrevented) toggleTheme(); }}
    onPointerDown={event => { onPointerDown?.(event); press(0.9); }}
    onPointerUp={event => { onPointerUp?.(event); press(1); }}
    onPointerLeave={event => { onPointerLeave?.(event); press(1); }}
    onPointerCancel={event => { onPointerCancel?.(event); press(1); }}>
    <span className="magicui-theme-icon" aria-hidden="true">
      <span className="theme-icon-sun" style={{ opacity: activeTheme === "dark" ? 1 : 0 }}><Sun size={22} /></span>
      <span className="theme-icon-moon" style={{ opacity: activeTheme === "dark" ? 0 : 1 }}><Moon size={22} /></span>
    </span>
  </button>;
}
