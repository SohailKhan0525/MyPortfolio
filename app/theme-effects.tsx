"use client";

import { useEffect, useState } from "react";

const THEME_SOUND = "data:audio/wav;base64,UklGRhgLAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YfQKAACAf4CAgH+Af39/f39/gH+Af3+Af4B/gICAf4CAgH+Af4B/gIB/f39/gIB/gICAf39/f4B/f39/f39/f39/f39/f4CAgH9/f4CAgH+Af39/gIB/f39/gIB/f4CAf3+AgH+AgH+AgICAf4B/gIB/gIB/f39/f39/f4B/f39/f39/f3+Af4B/gICAf4CAgICAgIB/gIB/gH9/f39/f39/f39/f4CAgH+Af4CAf4B/gH+Af4CAf39/f39/f39/f39/f4B/gICAf4CAf4B/f39/f39/f4CAgICAgIB/f3+AgH9/gH9/f39/f39/f39/f3+Af4CAf4B/gH9/gH9/f4B/f3+AgIB/gIB/gIB/gH9/gH9/gH9/f4B/f39/f4B/gIB/f4B/f4CAgH+Af39/gH+Af3+AgICAgIB/f4B/gIB/gH9/f39/f39/f3+Af4CAgICAgH+AgIB/gIB/f39/f39/gH+Af4CAgICAgICAf4B/f39/gIB/gH9/gH9/gH9/gH+AgH+Af4CAf3+Af39/f39/gICAgIB/gIB/gICAgH9/f39/f39/f3+AgH9/gIB/gICAf3+AgIB/f3+Af4B/gICAf3+Af39/f39/f39/f39/f3+Af4CAgIB/f4B/gH+AgICAgH+Af39/f39/gH+AgICAf4B/gIB/f39/f39/f39/gICAgICAgIB/gIB/gIB/f3+Af4B/f39/f3+AgICAgIB/f4B/gH9/f39/gH+AgH9/gH+Af3+Af4B/f39/f39/f39/gH+AgICAgICAgH+Af39/f39/f4B/f4CAgICAgIB/gH+Af3+Af3+Af3+Af4B/f4CAgICAgIB/f4B/f39/f39/gH+AgICAgIB/gH9/f4B/gH9/f39/gH+AgICAgICAgIB/f39/gH+AgH+Af3+Af3+AgH+AgICAf4B/f3+Af39/gIB/f3+AgH+AgH+AgH9/f3+AgH+AgICAf4B/f39/f4CAgIB/f4B/f39/f39/f4B/gICAgH+AgH9/gIB/gICAgH+AgH+AgIB/gICAgH+AgIB/gICAgIB/f4B/gIB/f3+Af4CAf4B/f4B/f39/f39/gIB/gH+AgH+Af4B/f3+Af4B/gH9/gH+AgH+Af39/gH9/gH9/gH9/gH+Af3+Af4B/f4CAf3+Af39/gIB/gICAf4CAf4B/f39/f4B/f4B/gICAgH9/gH9/f4B/f4CAgH9/gIB/f3+Af3+Af3+AgH+Af39/gH+Af4CAf4CAf4CAf39/f4CAgICAf3+Af39/gIB/f4B/f3+AgICAgIB/gH+Af4B/gH+Af39/f4CAgIB/gH9/f4CAf3+Af3+Af4B/gICAf39/f39/f4CAgH+Af39/f39/gIB/f4B/gIB/gH9/gH9/f3+Af3+AgH9/gIB/gIB/f4CAf3+Af4B/gH9/f3+AgIB/gIB/gH+Af39/gH+Af4B/f4B/f4CAf4CAf4B/f4CAgIB/gX+Af39/gICAgH+AgH6AgIB/f39/f4B/gICAgH9/f4B/gH9/f4B/f4B9gIKBf4J+gIF+gX99gH+Be3N3h3+HgoV+fX2FdoqAgX2Dg3uCg3t/gYJ/foOAf4CAgH+Af39/f4CAf3+Af3+AfYCBf4CBf39/gH99f4B/f36Af4CAgIB/fn6Afn+Bf4B/fn9+f4CAgX+Af39/f4B/f39/f3+Af4CAf3+Af3+AgH+AgH+BgH9/f3+Af4B/f39/f3+AgH+Af4CAgICAf36Bf36BgIB/f4B+f39/gH+AgIB/f4B/gH9/f36AgH9/f4CAf3+Af39/gH9/f4CAf4CAf35/gH9/gH6BgIGBfIGLiIV8eHZ+fIF/g393fIaCdXyDjHx3foiBf39/gX58gIJ/fIB/gYCBgYB8e4GBfn6AgH9/gH+Bf4CAf39/gH9/gIB/gICAf4CAgIGDgYJ8fX2Cf31+gH9+gIF/goKCfn6Bf39+fX9+f4CBgYCAgYCAf39/f39/gIB/gH2Bf3t/f4GBgYB/f3+AgIKBf4F+gX5/enxif3qRgoiAeXx+gYh5e358d4GHf31lgYmGoIWak5yTdHxtemJvlYl6coqHao1wZ5aIsH6cZXaHcouBjouIjV92Z3Z4bn6GhY1+hn+EdIZ4gHyIfXuGen2BfoN/hHmBgn+CfIB9gX5/f399gnx9gYB9gn+Af35+gIB8goF9gnx/goF8fIB+gIF9fX+BfoB/f4F+gH5/fn9+gH9+gIF/f36CgIKAgYCDfn9/gn+AfH+AfoGAgICAgICBgIB/gX+Afn+Afn9+gX6AgH1/fX9/f39+gH9/gICAgYB/f4B+fn+Af4B/foB/foF/gH+AgIF+gH+Bgn9+fn5/f39+gIKAf4GBgH9/gX9+gH6AgoGBhoF+hmx/fox/e36Ag4ePe4CIeoSEf4KEgH+AgnmGf3uBg4F9g4N8fIB9f35/gX+AgIB+fX9/gX6AgH+AgIB/f39/f4B/f4B/gIF/f4GBfX+Bf3+Af4GAf4CAf39/gIB/f4CAf4CAf4CAf3+AgH9/f39/f4CAgH+AgH9/f3+Af3+Af4CAf4B/f4B/f3+Af4CAf3+Af4B/f39/gICAgIB/gH+AgH+Af4B/gIB/f39/f4CAf4CAf39/gICAf39/gH+Af4CAf4CAf4B/f4CAf4CAgH+AgH+Af3+AgIB/f39/f4CAgICAgH+AgIB/gH+Af3+Af4CAf4B/f4B/gIB/gIB/gIB/gIB/f4B/f3+Af3+AgH+AgIB/f4B/gH9/f4CAgIB/gIB/f4CAf4B/gH+AgH9/gH+AgH+AgIB/gICAf4CAf4B/gH9/f4CAf3+AgH+Af3+AgH9/gH9/f3+Af4CAgH9/gH9/gH9/gH+Af4CAf3+Af3+AgH9/gH9/gH+AgH9/f4B/gICAf4B/gH9/f4B/f39/gH9/f4B/gIB/gICAgH+AgICAgIB/gH9/gH9/f39/f4CAf4CAgH9/gICAgIB/gH9/gH9/f3+AgH9/f4B/f4B/f4B/gIB/gIB/f4B/f39/f4B/gICAf4CAgIB/f39/gICAgICAgIB/gH9/f4B/f4B/f4CAgH9/gIB/f39/gH+AgH+Af3+Af39/gH9/gH9/f39/f39/gICAf4CAf3+Af4B/f39/f39/gIB/f3+Af39/gICAf39/f39/f3+Af3+Af39/f4B/gH+Af4B/gH9/gIB/gH9/f39/f39/gH9/f3+AgH9/f39/f4CAgH+AgICAgIB/f4B/f39/gICAf4B/f39/f4B/gH9/f39/gIB/f4CAgIB/f39/f39/gICAgH+Af39/f39/f3+Af4CAf4CAgICAf3+Af39/gH9/gH9/f39/f39/f39/gH9/gICAgIB/gH9/gH9/f39/f3+Af3+Af39/f39/f39/gH+AgIB/gICAgICAgIB/gH9/gIB/f39/f4B/f4B/f39/f39/f39/f39/f4B/f4CAgIB/f39/f4CAf4B/f39/f39/f3+AgICAgICAgICAf4B/f39/f39/f39/f3+AgH+AgH+Af3+AgICAf4CAgH+Af39/f39/f3+AgH+Af39/f3+AgIB/gIB/gIB/gH9/f39/f39/f39/gIB/gICAgICAgICAf39/f39/gH9/f4B/gH+AgIB/gICAgH9/f4B/f39/f3+Af3+Af4B/f39/f39/f39/f39/f4CAgICAgH+Af4CAgICAf4B/f39/f39/f39/gICAgICAgICAf39/f39/f39/f39/f3+Af4CAgA==";

export default function ThemeEffects() {
  const [active, setActive] = useState(false);
  const [targetTheme, setTargetTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".theme-option");
      if (!button) return;

      const label = button.textContent?.trim().toLowerCase();
      const next = label === "light" ? "light" : label === "dark" ? "dark" : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      setTargetTheme(next);

      if (localStorage.getItem("portfolio-sound") !== "off") {
        const audio = new Audio(THEME_SOUND);
        audio.volume = 0.42;
        void audio.play().catch(() => undefined);
      }

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setActive(false);
        requestAnimationFrame(() => setActive(true));
        window.setTimeout(() => setActive(false), 760);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <>
      <div className={`theme-wipe ${active ? "is-active" : ""} ${targetTheme}`} aria-hidden="true" />
      <style jsx global>{`
        .theme-wipe {
          position: fixed;
          z-index: 9999;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          clip-path: circle(0 at 100% 0);
          will-change: clip-path, opacity;
        }
        .theme-wipe.dark {
          background: radial-gradient(circle at 85% 8%, #222 0, #090909 48%, #000 100%);
        }
        .theme-wipe.light {
          background: radial-gradient(circle at 85% 8%, #fff 0, #f5f5f2 52%, #ecece7 100%);
        }
        .theme-wipe.is-active {
          animation: themeWipe 720ms cubic-bezier(.22,.8,.2,1) both;
        }
        .theme-button svg {
          transition: transform 420ms cubic-bezier(.22,.8,.2,1), opacity 220ms ease;
        }
        .theme-button:active svg {
          transform: rotate(28deg) scale(.82);
        }
        @keyframes themeWipe {
          0% { opacity: .98; clip-path: circle(0 at 100% 0); }
          62% { opacity: .98; clip-path: circle(150vmax at 100% 0); }
          100% { opacity: 0; clip-path: circle(150vmax at 100% 0); }
        }
        @media (max-width: 720px) {
          .theme-wipe.is-active { animation-duration: 600ms; }
        }
        @media (prefers-reduced-motion: reduce) {
          .theme-wipe { display: none; }
          .theme-button svg { transition: none; }
        }
      `}</style>
    </>
  );
}
