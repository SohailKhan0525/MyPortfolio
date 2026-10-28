"use client";

import { useSyncExternalStore } from "react";

const subscribers = new Set<() => void>();
let scrolling = false;
let idleTimer: ReturnType<typeof setTimeout> | undefined;

function publish(next: boolean) {
  if (scrolling === next) return;
  scrolling = next;
  subscribers.forEach(notify => notify());
}

function onScroll() {
  // No layout reads and no React updates per frame: only start/settled changes.
  publish(true);
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => publish(false), 160);
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  if (subscribers.size === 1) window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0) {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idleTimer);
      idleTimer = undefined;
      scrolling = false;
    }
  };
}

const getSnapshot = () => scrolling;
const getServerSnapshot = () => false;

/** One passive listener shared by visible decorative illustrations. */
export function useScrollActivity() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
