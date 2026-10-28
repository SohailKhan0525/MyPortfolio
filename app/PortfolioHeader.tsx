"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { List, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";
import ThemeToggle from "./ThemeToggle";
import { usePortfolioMotion } from "./MotionPreferences";

const navigation = [["Work", "#work"], ["AI Era", "#ai-era"], ["About", "#about"], ["Journey", "#journey"], ["Skills", "#skills"], ["Resume", "/resume"], ["Contact", "#contact"]] as const;

/** Scroll-linked navigation state stays here instead of rerendering the portfolio. */
export default function PortfolioHeader() {
  const { reduced } = usePortfolioMotion();
  const menuRef = useRef<HTMLButtonElement>(null);
  const [mobile, setMobile] = useState(false);
  const [currentSection, setCurrentSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) setCurrentSection(`#${visible.target.id}`);
    }, { rootMargin: "-15% 0px -65% 0px" });
    document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return <header className="site-header" onKeyDown={event => {
    if (event.key === "Escape" && mobile) { setMobile(false); menuRef.current?.focus(); }
  }}>
    <Link href="#top" className="brand" aria-label="Mohd Zaheer Uddin — home" data-sound onClick={() => setMobile(false)}>
      <BrandMark /><span>Mohd Zaheer Uddin</span>
    </Link>
    <nav className={`desktop-nav ${mobile ? "mobile-visible" : ""}`} id="primary-navigation" aria-label="Primary navigation">
      {navigation.map(([label, href]) => <Link key={label} href={href} className="nav-link"
        aria-current={currentSection === href ? "location" : undefined} data-sound onClick={() => setMobile(false)}>
        {label}{currentSection === href && <motion.span className="nav-current" layoutId="navigation-current"
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} />}
      </Link>)}
    </nav>
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
