"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { usePortfolioMotion } from "./MotionPreferences";
import { registerSectionScroller } from "./portfolio-scroll";
import "lenis/dist/lenis.css";
import "./smooth-scroll.css";

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
const nativeScrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab"]);

/** Native window scrolling stays the source of truth for sticky panels, Motion
 * scroll values and the fixed robot. No translated page or perpetual RAF loop. */
export default function SmoothScroll() {
  const { reduced, ready } = usePortfolioMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || reduced) return;
    let lenis: Lenis | null = null;
    let frame: number | null = null;
    let navigation = 0;
    let unregister: (() => void) | undefined;
    let releaseFocus: (() => void) | undefined;
    const narrowViewport = window.matchMedia("(max-width: 60rem)");

    const tick = (time: number) => {
      frame = null;
      if (!lenis || document.hidden) return;
      lenis.raf(time);
      if (lenis.isScrolling === "smooth") frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!lenis || frame !== null || document.hidden) return;
      // Reset the external clock BEFORE starting another animation, otherwise
      // an idle interval would be mistaken for one enormous animation frame.
      lenis.raf(performance.now());
      frame = requestAnimationFrame(tick);
    };
    const cancel = () => {
      navigation++;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      // Public Lenis lifecycle methods cancel momentum without consuming the
      // browser's key, scrollbar drag, history restoration or touch gesture.
      lenis?.stop();
      lenis?.start();
    };
    const focusTarget = (target: HTMLElement) => {
      releaseFocus?.();
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        const cleanup = () => {
          target.removeAttribute("tabindex");
          target.removeEventListener("blur", cleanup);
        };
        target.addEventListener("blur", cleanup, { once: true });
        releaseFocus = cleanup;
      } else releaseFocus = undefined;
      target.focus({ preventScroll: true });
    };
    const navigate = (target: HTMLElement) => {
      if (!lenis) return;
      const currentNavigation = ++navigation;
      wake();
      lenis.scrollTo(target, {
        duration: 1.05,
        lerp: 0,
        easing: easeOutCubic,
        onComplete: () => {
          if (lenis && currentNavigation === navigation && target.isConnected) focusTarget(target);
        },
      });
    };
    const destroy = () => {
      navigation++;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      unregister?.();
      unregister = undefined;
      lenis?.destroy();
      lenis = null;
      delete document.documentElement.dataset.scrollEngine;
    };
    const start = () => {
      if (lenis || document.hidden) return;
      lenis = new Lenis({
        autoRaf: false,
        duration: 1.05,
        lerp: 0,
        easing: easeOutCubic,
        wheelMultiplier: 0.9,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        respectReducedMotion: true,
        // Explicit, constant-time exemptions avoid measuring nested layouts on
        // every wheel event. Horizontal project browsing remains native too.
        prevent: node => node.classList.contains("terminal-history")
          || (node.classList.contains("project-explorer-list") && narrowViewport.matches)
          || (node.classList.contains("desktop-nav") && node.classList.contains("mobile-visible"))
          || node.matches("input, textarea, select, [data-scroll-native]"),
        virtualScroll: ({ event }) => !event.ctrlKey && !event.shiftKey,
      });
      lenis.on("virtual-scroll", ({ event }) => {
        navigation++;
        if (event.type === "wheel") wake();
      });
      unregister = registerSectionScroller(navigate);
      document.documentElement.dataset.scrollEngine = "lenis";
    };
    const visibility = () => document.hidden ? destroy() : start();
    const keydown = (event: KeyboardEvent) => {
      if (nativeScrollKeys.has(event.key)) cancel();
    };
    const click = (event: MouseEvent) => {
      if (!lenis || event.defaultPrevented || event.button !== 0
        || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href, location.href);
      if (destination.origin !== location.origin) return;
      if (destination.pathname !== location.pathname || destination.search !== location.search) {
        cancel();
        return;
      }
      if (!destination.hash) return;
      // The skip link remains immediate and native. Its <main> target is focusable.
      if (link.classList.contains("skip-link") || link.hasAttribute("data-scroll-native")) {
        cancel();
        return;
      }
      let target: HTMLElement | null = null;
      try { target = document.getElementById(decodeURIComponent(destination.hash.slice(1))); } catch { return; }
      if (!target) return;
      // Capture prevents Next Link from starting a second scroll. Propagation
      // continues so its existing menu-close/click handlers still run normally.
      event.preventDefault();
      if (location.hash !== destination.hash) history.pushState(history.state, "", destination.href);
      navigate(target);
    };

    start();
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("pointerdown", cancel, { passive: true });
    window.addEventListener("popstate", cancel);
    window.addEventListener("hashchange", cancel);
    return () => {
      destroy();
      releaseFocus?.();
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("pointerdown", cancel);
      window.removeEventListener("popstate", cancel);
      window.removeEventListener("hashchange", cancel);
    };
  }, [pathname, ready, reduced]);

  return null;
}
