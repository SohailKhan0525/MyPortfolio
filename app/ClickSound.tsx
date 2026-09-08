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
      try {
        const context = new Ctor();
        contextRef.current = context;
        return context;
      } catch {
        return null;
      }
    };

    const playClick = (context: AudioContext) => {
      const time = context.currentTime;
      const gain = context.createGain();
      const body = context.createOscillator();
      const tick = context.createOscillator();

      body.type = "sine";
      body.frequency.setValueAtTime(520, time);
      body.frequency.exponentialRampToValueAtTime(260, time + 0.075);

      tick.type = "triangle";
      tick.frequency.setValueAtTime(1450, time);
      tick.frequency.exponentialRampToValueAtTime(700, time + 0.035);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.055, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.095);

      body.connect(gain);
      tick.connect(gain);
      gain.connect(context.destination);
      body.start(time);
      tick.start(time);
      body.stop(time + 0.1);
      tick.stop(time + 0.055);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      const now = performance.now();
      if (now - lastClickRef.current < 70) return;
      lastClickRef.current = now;

      const context = getContext();
      if (!context) return;

      if (context.state !== "running") {
        void context.resume().then(() => {
          if (context.state === "running") playClick(context);
        }).catch(() => undefined);
      } else {
        playClick(context);
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
