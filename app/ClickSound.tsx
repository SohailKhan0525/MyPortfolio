"use client";

import { useEffect, useRef } from "react";

export default function ClickSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const lastClickRef = useRef(0);

  useEffect(() => {
    const getContext = () => {
      if (contextRef.current) return contextRef.current;
      const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const context = new Ctor({ latencyHint: "interactive" });
      contextRef.current = context;
      return context;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (localStorage.getItem("portfolio-sound") === "off") return;

      const now = performance.now();
      if (now - lastClickRef.current < 55) return;
      lastClickRef.current = now;

      const context = getContext();
      if (!context) return;

      const play = () => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const time = context.currentTime;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(330, time);
        oscillator.frequency.exponentialRampToValueAtTime(250, time + 0.055);
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(0.018, time + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(time);
        oscillator.stop(time + 0.075);
      };

      if (context.state === "suspended" || context.state === "interrupted") {
        void context.resume().then(play).catch(() => undefined);
      } else {
        play();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      void contextRef.current?.close();
    };
  }, []);

  return null;
}
