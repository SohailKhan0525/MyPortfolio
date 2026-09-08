"use client";

import { Howl } from "howler";
import { useEffect, useRef } from "react";

const CLICK_SOUND = "/sounds/click.mp3";

export default function ClickSound() {
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    const sound = new Howl({
      src: [CLICK_SOUND],
      preload: true,
      volume: 1,
      html5: false,
    });
    soundRef.current = sound;

    const play = () => {
      if (sound.state() !== "loaded") sound.load();
      sound.stop();
      sound.volume(1);
      sound.play();
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-sound]")) return;
      play();
    };

    const handleRequestedSound = () => play();

    document.addEventListener("click", handleClick, true);
    window.addEventListener("portfolio:click-sound", handleRequestedSound);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("portfolio:click-sound", handleRequestedSound);
      sound.unload();
      soundRef.current = null;
    };
  }, []);

  return null;
}
