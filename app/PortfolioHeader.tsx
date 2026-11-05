"use client";

import Link from "next/link";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { List, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import BrandMark from "./BrandMark";
import ThemeToggle from "./ThemeToggle";
import { usePortfolioMotion } from "./MotionPreferences";
import "./navigation-motion.css";

const navigation = [["Work", "#work"], ["AI Era", "#ai-era"], ["About", "#about"], ["Journey", "#journey"], ["Skills", "#skills"], ["Resume", "/resume"], ["Contact", "#contact"]] as const;
const menuEase = [0.22, 1, 0.36, 1] as const;

function Navigation({ compact, currentSection, close, menuRef }: {
  compact: boolean;
  currentSection: string;
  close: (restoreFocus?: boolean) => void;
  menuRef: RefObject<HTMLButtonElement | null>;
}) {
  const { reduced } = usePortfolioMotion();
  const present = useIsPresent();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (compact && present) navRef.current?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
  }, [compact, present]);

  const settled = { opacity: 1, y: 0, scale: 1 };
  return <motion.nav
    ref={navRef}
    className={`desktop-nav navigation-surface ${compact ? "mobile-visible" : ""}`}
    id="primary-navigation"
    aria-label="Primary navigation"
    aria-hidden={compact && !present ? true : undefined}
    inert={compact && !present ? true : undefined}
    data-menu-surface={compact ? "mobile" : "desktop"}
    data-menu-present={present}
    data-lenis-prevent={compact ? "" : undefined}
    initial={compact && !reduced ? "closed" : false}
    animate={compact ? "open" : "desktop"}
    exit="closed"
    variants={{
      desktop: { ...settled, transition: { duration: 0 } },
      open: { ...settled, transition: { type: "tween", duration: reduced ? 0 : 0.32, ease: menuEase, staggerChildren: reduced ? 0 : 0.03, delayChildren: reduced ? 0 : 0.035 } },
      closed: { opacity: reduced || !compact ? 1 : 0, y: reduced || !compact ? 0 : -10, scale: reduced || !compact ? 1 : 0.985, transition: { type: "tween", duration: reduced || !compact ? 0 : 0.18, ease: menuEase, staggerChildren: 0, delayChildren: 0 } },
    }}
    onBlurCapture={event => {
      const next = event.relatedTarget;
      if (compact && next instanceof Node && !event.currentTarget.contains(next) && next !== menuRef.current) close();
    }}
  >
    {navigation.map(([label, href]) => <motion.span key={label} className="navigation-item"
      variants={{
        desktop: { opacity: 1, y: 0, transition: { duration: 0 } },
        open: { opacity: 1, y: 0, transition: { type: "tween", duration: reduced ? 0 : 0.28, ease: menuEase } },
        closed: { opacity: reduced || !compact ? 1 : 0, y: reduced || !compact ? 0 : 8, transition: { type: "tween", duration: reduced || !compact ? 0 : 0.12, ease: menuEase } },
      }}>
      <Link href={href} className="nav-link" aria-current={currentSection === href ? "location" : undefined}
        data-sound onClick={() => close(compact)}>
        {label}{currentSection === href && <motion.span className="nav-current" layoutId="navigation-current"
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} />}
      </Link>
    </motion.span>)}
  </motion.nav>;
}

/** Scroll-linked navigation state stays here instead of rerendering the portfolio. */
export default function PortfolioHeader() {
  const { reduced } = usePortfolioMotion();
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  // SSR keeps the ordinary desktop tree. Existing media CSS hides it on phones
  // until hydration resolves the breakpoint, so there is no open-menu flash.
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
    if (!compact || !mobile) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        if (headerRef.current?.contains(document.activeElement)) menuRef.current?.focus({ preventScroll: true });
        setMobile(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [compact, mobile]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) setCurrentSection(`#${visible.target.id}`);
    }, { rootMargin: "-15% 0px -65% 0px" });
    document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return <header ref={headerRef} className="site-header" onKeyDown={event => {
    if (event.key === "Escape" && mobile) { event.preventDefault(); setMobile(false); menuRef.current?.focus({ preventScroll: true }); }
  }}>
    <Link href="#top" className="brand" aria-label="Mohd Zaheer Uddin — home" data-sound onClick={() => setMobile(false)}>
      <BrandMark /><span>Mohd Zaheer Uddin</span>
    </Link>
    <AnimatePresence initial={false}>
      {(!compact || mobile) && <Navigation key="primary-navigation" compact={compact} currentSection={currentSection}
        menuRef={menuRef} close={restoreFocus => {
          if (restoreFocus) menuRef.current?.focus({ preventScroll: true });
          setMobile(false);
        }} />}
    </AnimatePresence>
    <div className="header-actions">
      <ThemeToggle />
      <motion.button whileTap={reduced ? undefined : { scale: 0.92 }} ref={menuRef} className="mobile-menu-button"
        aria-controls="primary-navigation" data-sound type="button" onClick={() => setMobile(value => !value)}
        aria-expanded={mobile} aria-label="Toggle navigation">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={String(mobile)} initial={reduced ? false : { opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: reduced ? 0 : 45 }}
            transition={{ type: "tween", duration: reduced ? 0 : 0.16 }}>
            {mobile ? <X size={20} /> : <List size={20} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  </header>;
}
