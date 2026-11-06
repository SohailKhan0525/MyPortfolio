"use client";

import Link from "next/link";
import BrandMark from "./BrandMark";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import { gsap, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import "./underpage-footer.css";

/** The stationary flow marker makes the under-page reveal independent of sticky geometry. */
export default function UnderpageFooter({ linkedin }: { linkedin: string }) {
  const marker = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLElement>(null);
  const { reduced, ready } = usePortfolioMotion();
  const [size, setSize] = useState({ height: 0, viewport: 1, fits: false });
  const enabled = ready && !reduced && size.fits;

  useEffect(() => {
    const node = footer.current;
    if (!node) return;
    const measure = () => {
      const height = Math.ceil(node.offsetHeight);
      const viewport = document.documentElement.clientHeight || window.innerHeight;
      const available = window.visualViewport?.height ?? viewport;
      const fits = height > 0 && height < available - 80;
      setSize(current => current.height === height && current.viewport === viewport && current.fits === fits
        ? current : { height, viewport, fits });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure, { passive: true });
    window.visualViewport?.addEventListener("resize", measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  useGSAP(() => {
    if (!footer.current || !marker.current || !enabled) return;
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: marker.current, start: "top bottom", end: () => `+=${size.height}`, scrub: true, invalidateOnRefresh: true },
    })
      .fromTo(footer.current, { opacity: 0 }, { opacity: 1, duration: 1 }, 0)
      .fromTo(".underpage-footer-content", { y: 34 }, { y: 0, duration: 1 }, 0)
      .fromTo(".underpage-footer-rule > span", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      .fromTo(".footer-signature-letter", { yPercent: 90, rotate: 3 }, { yPercent: 0, rotate: 0, stagger: 0.035, duration: 0.7 }, 0.08);
  }, { scope: footer, dependencies: [enabled, size.height], revertOnUpdate: true });

  const revealForKeyboard = (event: FocusEvent<HTMLElement>) => {
    if (!enabled || !(event.target instanceof HTMLElement) || !event.target.matches(":focus-visible")) return;
    const top = marker.current?.getBoundingClientRect().top;
    if (top === undefined || top + size.height <= size.viewport) return;
    window.scrollTo({ top: window.scrollY + top + size.height - size.viewport, behavior: "instant" });
  };

  return <>
    <div ref={marker} className="footer-reveal-marker" aria-hidden="true" />
    <footer ref={footer} id="portfolio-footer" className="underpage-footer" data-reveal={enabled ? "enabled" : "static"} onFocusCapture={revealForKeyboard}>
      <div className="underpage-footer-rule" aria-hidden="true"><span /></div>
      <div className="underpage-footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <BrandMark />
            <div><strong>Mohd Zaheer Uddin</strong><span>ML &amp; Data Science with Python</span></div>
          </div>
          <div className="footer-links">
            <Link href="#work">Work</Link><Link href="#about">About</Link>
            <Link href="#skills">Skills</Link><Link href="#contact">Contact</Link>
            <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
            <a href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </div>
        <div className="footer-signature" aria-hidden="true">{"ZAHEER".split("").map((letter, index) => <span className="footer-signature-mask" key={index}><span className="footer-signature-letter">{letter}</span></span>)}</div>
        <div className="footer-bottom">
          <div><span>© 2026 Mohd Zaheer Uddin.</span><span>Built with Next.js &amp; deployed on Vercel.</span></div>
          <span>Available for internships &amp; collaborations.</span>
          <Link href="#top" className="footer-back-top">Back to top <span aria-hidden="true">↑</span></Link>
        </div>
      </div>
    </footer>
  </>;
}
