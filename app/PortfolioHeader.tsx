"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";
import ThemeToggle from "./ThemeToggle";
import { gsap, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import "./navigation-motion.css";

const navigation = [["Work", "#work"], ["AI Era", "#ai-era"], ["About", "#about"], ["Journey", "#journey"], ["Skills", "#skills"], ["Resume", "/resume"], ["Contact", "#contact"]] as const;

/** One navigation tree serves both breakpoints; only the mobile curtain is modal. */
export default function PortfolioHeader() {
  const { reduced, ready } = usePortfolioMotion();
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const menuTimeline = useRef<gsap.core.Timeline | null>(null);
  const [compact, setCompact] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [currentSection, setCurrentSection] = useState("");

  useEffect(() => {
    const query = window.matchMedia("(max-width: 64rem)");
    const update = () => { setCompact(query.matches); setMobile(false); };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) setCurrentSection(`#${visible.target.id}`);
    }, { rootMargin: "-15% 0px -65% 0px" });
    document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    const nav = navRef.current;
    if (!nav) return;
    if (!compact) {
      gsap.set(nav, { clearProps: "clipPath,visibility,opacity,transform" });
      gsap.set(nav.querySelectorAll(".navigation-link-label"), { clearProps: "all" });
      return;
    }
    if (reduced || !ready) return;
    gsap.set(nav, { visibility: "hidden", clipPath: "inset(0 0 100% 0)" });
    menuTimeline.current = gsap.timeline({ paused: true, onReverseComplete: () => { gsap.set(nav, { visibility: "hidden" }); } })
      .fromTo(nav, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.64, ease: "power4.inOut" })
      .fromTo(nav.querySelectorAll(".navigation-link-label"), { yPercent: 115, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 0.58, stagger: 0.035, ease: "power3.out" }, 0.16)
      .fromTo(nav.querySelectorAll(".navigation-caption, .navigation-note"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.07 }, 0.36);
    return () => { menuTimeline.current = null; };
  }, { scope: headerRef, dependencies: [compact, reduced, ready], revertOnUpdate: true });

  useEffect(() => {
    if (!compact || !navRef.current) return;
    if (reduced || !ready) {
      gsap.set(navRef.current, { visibility: mobile ? "visible" : "hidden", clipPath: mobile ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" });
      return;
    }
    const timeline = menuTimeline.current;
    if (mobile) {
      // Keyboard focus must not wait for the ticker to render the curtain.
      gsap.set(navRef.current, { visibility: "visible" });
      timeline?.timeScale(1).play();
    }
    else timeline?.timeScale(1.4).reverse();
  }, [mobile, compact, reduced, ready]);

  useGSAP(() => {
    gsap.to(".menu-line-first", { y: mobile ? 3.5 : 0, rotation: mobile ? 45 : 0, duration: reduced ? 0 : 0.3, ease: "power3.inOut", overwrite: true });
    gsap.to(".menu-line-last", { y: mobile ? -3.5 : 0, rotation: mobile ? -45 : 0, duration: reduced ? 0 : 0.3, ease: "power3.inOut", overwrite: true });
  }, { scope: headerRef, dependencies: [mobile, reduced], revertOnUpdate: true });

  useGSAP(() => {
    if (compact || !navRef.current) return;
    const nav = navRef.current;
    const marker = nav.querySelector<HTMLElement>(".nav-current");
    const align = () => {
      const current = nav.querySelector<HTMLElement>('[aria-current="location"]');
      if (!current || !marker) { if (marker) gsap.set(marker, { opacity: 0 }); return; }
      const outer = nav.getBoundingClientRect();
      const inner = current.getBoundingClientRect();
      gsap.to(marker, { x: inner.left - outer.left + 10, width: Math.max(0, inner.width - 20), opacity: 1, duration: reduced ? 0 : 0.42, ease: "power3.out", overwrite: true });
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(nav);
    return () => { observer.disconnect(); if (marker) gsap.killTweensOf(marker); };
  }, { scope: headerRef, dependencies: [currentSection, compact, reduced], revertOnUpdate: true });

  useEffect(() => {
    if (!compact || !mobile) return;
    const oldOverflow = document.body.style.overflow;
    const mainAndFooter = Array.from(document.querySelectorAll<HTMLElement>("main, .underpage-footer"));
    const previousInert = mainAndFooter.map(node => node.inert);
    mainAndFooter.forEach(node => { node.inert = true; });
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("portfolio:menu-state", { detail: { open: true } }));
    // Focus waits for no visual animation: the curtain never delays keyboard access.
    navRef.current?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = oldOverflow;
      mainAndFooter.forEach((node, index) => { node.inert = previousInert[index]; });
      window.dispatchEvent(new CustomEvent("portfolio:menu-state", { detail: { open: false } }));
    };
  }, [compact, mobile]);

  const closeMenu = (restoreFocus = false) => {
    if (restoreFocus) menuRef.current?.focus({ preventScroll: true });
    setMobile(false);
  };

  return <header ref={headerRef} className="site-header" data-menu-open={compact && mobile}
    role={compact && mobile ? "dialog" : undefined} aria-modal={compact && mobile ? true : undefined}
    aria-label={compact && mobile ? "Site navigation" : undefined}
    onKeyDown={event => {
      if (!compact || !mobile) return;
      if (event.key === "Escape") { event.preventDefault(); closeMenu(true); }
      if (event.key !== "Tab") return;
      const targets = Array.from(headerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter(node => !node.closest('[inert]'));
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <Link href="#top" className="brand" aria-label="Mohd Zaheer Uddin — home" data-sound onClick={() => closeMenu()}>
      <BrandMark /><span>Mohd Zaheer Uddin</span>
    </Link>
    <nav ref={navRef} className="desktop-nav navigation-surface" id="primary-navigation"
      aria-label="Primary navigation" aria-hidden={compact && !mobile ? true : undefined}
      inert={compact && !mobile ? true : undefined} data-menu-surface={compact ? "mobile" : "desktop"}
      data-menu-present={mobile} data-scroll-native>
      <span className="navigation-caption">Explore the portfolio</span>
      {navigation.map(([label, href], index) => <span key={label} className="navigation-item">
        <Link href={href} className="nav-link" aria-current={currentSection === href ? "location" : undefined}
          data-sound onClick={() => closeMenu(compact)}>
          <span className="navigation-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <span className="navigation-link-mask"><span className="navigation-link-label">{label}</span></span>
          <span className="navigation-arrow" aria-hidden="true">↗</span>
        </Link>
      </span>)}
      <span className="nav-current" aria-hidden="true" />
      <span className="navigation-note">Python, machine learning &amp; things I’m building.</span>
    </nav>
    <div className="header-actions">
      <ThemeToggle />
      <button ref={menuRef} className="mobile-menu-button" aria-controls="primary-navigation" data-sound type="button"
        onClick={() => setMobile(value => !value)} aria-expanded={mobile} aria-label={mobile ? "Close navigation" : "Open navigation"}>
        <span className="menu-glyph" aria-hidden="true"><span className="menu-line-first" /><span className="menu-line-last" /></span>
      </button>
    </div>
  </header>;
}
