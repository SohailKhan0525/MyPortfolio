"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { gsap, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import { registerSectionScroller } from "./portfolio-scroll";
import "./smooth-scroll.css";

gsap.registerPlugin(ScrollToPlugin);
const scrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab"]);

/** Eases the real window, so native sticky cards, history, and fixed Minty keep
 * their natural coordinates. Touch/trackpad horizontal gestures stay native. */
export default function SmoothScroll() {
  const { ready, reduced } = usePortfolioMotion();
  const pathname = usePathname();
  const marker = useRef(null);
  useGSAP((context) => {
    if (!ready || reduced) return;
    let tween: gsap.core.Tween | null = null;
    let destination = window.scrollY;
    let menuOpen = false;
    let focusCleanup: (() => void) | undefined;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const cancel = () => { tween?.kill(); tween = null; destination = window.scrollY; };
    const focus = (target: HTMLElement) => {
      focusCleanup?.();
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        const release = () => { target.removeAttribute("tabindex"); target.removeEventListener("blur", release); };
        target.addEventListener("blur", release, { once: true }); focusCleanup = release;
      }
      target.focus({ preventScroll: true });
    };
    const navigate = (target: HTMLElement) => {
      cancel();
      const header = document.querySelector(".site-header") as HTMLElement | null;
      const offset = (header?.offsetHeight ?? 80) + 24;
      context.ignore(() => {
        tween = gsap.to(window, { scrollTo: { y: target, offsetY: offset, autoKill: true, onAutoKill: cancel }, duration: .95,
          ease: "power3.inOut", onComplete: () => { tween = null; destination = window.scrollY; if (target.isConnected) focus(target); } });
      });
    };
    const unregister = registerSectionScroller(navigate);
    const wheel = (event: WheelEvent) => {
      if (menuOpen || !fine.matches || document.hidden || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey
        || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      const node = event.target instanceof Element ? event.target : null;
      if (node?.closest("input, textarea, select, [contenteditable], [data-scroll-native], .terminal-history, .project-explorer-list, .navigation-surface.mobile-visible")) return;
      // Preserve scrolling inside any independently scrollable region.
      for (let parent = node; parent && parent !== document.body; parent = parent.parentElement) {
        if (parent.scrollHeight > parent.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(parent).overflowY)) return;
      }
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      // A newly created tween is owned even before its first ticker frame.
      // Bursts within that frame must accumulate, rather than drop wheel input.
      if (!tween) destination = window.scrollY;
      destination = gsap.utils.clamp(0, max, destination + delta * .95);
      tween?.kill();
      // Replacement scroll tweens have explicit ownership. Registering every
      // wheel event in a long-lived context would retain thousands of dead tweens.
      context.ignore(() => {
        tween = gsap.to(window, { scrollTo: { y: destination, autoKill: false }, duration: .68, ease: "power3.out",
          onComplete: () => { tween = null; destination = window.scrollY; } });
      });
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) { cancel(); return; }
      if (anchor.matches(".skip-link, [data-scroll-native]")) { cancel(); return; }
      let target: HTMLElement | null;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
      if (!target) return;
      event.preventDefault();
      if (location.hash !== url.hash) history.pushState(history.state, "", url.href);
      navigate(target);
    };
    const key = (event: KeyboardEvent) => { if (scrollKeys.has(event.key)) cancel(); };
    const menu = (event: Event) => { menuOpen = Boolean((event as CustomEvent<{ open: boolean }>).detail?.open); if (menuOpen) cancel(); };
    const visibility = () => { if (document.hidden) cancel(); };
    document.documentElement.dataset.scrollEngine = "gsap";
    window.addEventListener("wheel", wheel, { passive: false });
    document.addEventListener("click", click, true); document.addEventListener("keydown", key, true);
    document.addEventListener("pointerdown", cancel, { passive: true }); document.addEventListener("touchstart", cancel, { passive: true });
    document.addEventListener("visibilitychange", visibility); window.addEventListener("portfolio:menu-state", menu);
    window.addEventListener("popstate", cancel); window.addEventListener("hashchange", cancel);
    return () => {
      cancel(); unregister(); focusCleanup?.(); delete document.documentElement.dataset.scrollEngine;
      window.removeEventListener("wheel", wheel); document.removeEventListener("click", click, true); document.removeEventListener("keydown", key, true);
      document.removeEventListener("pointerdown", cancel); document.removeEventListener("touchstart", cancel);
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("portfolio:menu-state", menu);
      window.removeEventListener("popstate", cancel); window.removeEventListener("hashchange", cancel);
    };
  }, { scope: marker, dependencies: [ready, reduced, pathname], revertOnUpdate: true });
  return null;
}
