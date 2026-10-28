"use client";

import Link from "next/link";
import BrandMark from "./BrandMark";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import { usePortfolioMotion } from "./MotionPreferences";
import "./underpage-footer.css";

/**
 * The marker stays in normal document flow while the footer sits underneath the
 * preceding page. Measuring the marker (not the sticky footer) keeps progress
 * consistent on Safari and when the browser's mobile toolbar changes height.
 */
export default function UnderpageFooter({ linkedin }: { linkedin: string }) {
  const marker = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLElement>(null);
  const { reduced, ready } = usePortfolioMotion();
  const [size, setSize] = useState({ height: 0, viewport: 1, fits: false });
  const [focused, setFocused] = useState(false);
  const fraction = Math.min(0.95, Math.max(0.01, size.height / size.viewport));
  const { scrollYProgress } = useScroll({
    target: marker,
    offset: ["start end", `start ${1 - fraction}`],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [28, 0]);
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
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(node);
    window.addEventListener("resize", measure, { passive: true });
    window.visualViewport?.addEventListener("resize", measure, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  const revealForKeyboard = (event: FocusEvent<HTMLElement>) => {
    setFocused(true);
    if (!enabled || !(event.target instanceof HTMLElement) || !event.target.matches(":focus-visible")) return;
    const top = marker.current?.getBoundingClientRect().top;
    if (top === undefined || top + size.height <= size.viewport) return;
    // Sticky content can be geometrically onscreen while the page covers it.
    // Bring its natural flow position into view so keyboard focus is never hidden.
    window.scrollTo({ top: window.scrollY + top + size.height - size.viewport, behavior: "instant" });
  };

  return <>
    <div ref={marker} className="footer-reveal-marker" aria-hidden="true" />
    <motion.footer
      ref={footer}
      className="underpage-footer"
      data-reveal={enabled ? "enabled" : "static"}
      style={{ opacity: enabled && !focused ? opacity : 1 }}
      onFocusCapture={revealForKeyboard}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="underpage-footer-rule" aria-hidden="true">
        <motion.span style={{ scaleX: enabled && !focused ? scrollYProgress : 1 }} />
      </div>
      <motion.div className="underpage-footer-content" style={{ y: enabled && !focused ? lift : 0 }}>
        <div className="footer-main">
          <div className="footer-brand">
            <BrandMark />
            <div><strong>Mohd Zaheer Uddin</strong><span>ML &amp; Data Science with Python</span></div>
          </div>
          <div className="footer-links">
            <Link href="#work">Work</Link><Link href="#about">About</Link>
            <Link href="#skills">Skills</Link><Link href="#contact">Contact</Link>
            <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Mohd Zaheer Uddin. Built with Next.js &amp; deployed on Vercel.</span>
          <span>Available for internships &amp; collaborations.</span>
        </div>
      </motion.div>
    </motion.footer>
  </>;
}
