"use client";

import { AnimatePresence, animate as animateValue, motion, stagger, useAnimate, useInView, useMotionValue, useTransform, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { usePortfolioMotion } from "./MotionPreferences";

export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Each block enters once, when its own mobile/desktop position becomes visible.
 * Content stays readable on return; scrolling never resets it to a dim state. */
export function Reveal({ children, delay = 0, className = "", sequence = false, variant = "lift" }: {
  children: ReactNode; delay?: number; className?: string; sequence?: boolean; variant?: "lift" | "panel" | "slide";
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { once: true, amount: "some", margin: "0px 0px -32px 0px" });
  const { reduced, ready } = usePortfolioMotion();

  useEffect(() => {
    const node = scope.current;
    if (!node || !ready) return;
    // Observe the stationary wrapper and move only its children. Moving the
    // observed node itself can retrigger IntersectionObserver at a scroll edge.
    const targets = Array.from(node.children);
    if (reduced) {
      const controls = animate(targets, { opacity: 1, x: 0, y: 0, scale: 1 }, { duration: 0 });
      return () => controls.stop();
    }
    if (!inView) return;
    const startDelay = Math.min(0.18, Math.max(0, delay));
    const controls = animate(targets, {
      opacity: [0.5, 1],
      x: variant === "slide" ? [22, 0] : 0,
      y: variant === "slide" ? 0 : [variant === "panel" ? 32 : 24, 0],
      scale: variant === "panel" ? [0.975, 1] : 1,
    }, {
      duration: variant === "panel" ? 0.8 : 0.65,
      delay: sequence ? stagger(0.07, { startDelay }) : startDelay, ease: easeOut,
    });
    return () => controls.stop();
  }, [inView, reduced, ready, sequence, delay, variant, animate, scope]);

  return <div ref={scope} className={`motion-reveal ${className}`}>
    {sequence ? children : <div className="motion-reveal-content">{children}</div>}
  </div>;
}

/** Decorative rules draw on entry, without measuring every section on scroll. */
export function MotionSection({ children, ...props }: Omit<HTMLMotionProps<"section">, "children"> & { children: ReactNode }) {
  const target = useRef<HTMLElement>(null);
  const { reduced } = usePortfolioMotion();
  const inView = useInView(target, { once: true, amount: "some", margin: "0px 0px -8% 0px" });
  return <motion.section {...props} ref={target}>
    {props.className?.includes("section-block") && <span className="section-rule" aria-hidden="true"><motion.span initial={false}
      animate={{ scaleX: !reduced && inView ? [0, 1] : 1 }}
      transition={{ type: "tween", duration: reduced ? 0 : 0.85, ease: easeOut }} /></span>}
    {children}
  </motion.section>;
}

export function AnimatedHeading({ children }: { children: string }) {
  const [scope, animate] = useAnimate<HTMLHeadingElement>();
  const inView = useInView(scope, { once: true, amount: 0.2 });
  const { reduced, ready } = usePortfolioMotion();
  useEffect(() => {
    if (!scope.current || !ready || !inView) return;
    const controls = animate(".hero-word", { y: reduced ? 0 : [26, 0], opacity: reduced ? 1 : [0.7, 1] }, {
      duration: reduced ? 0 : 0.8, delay: reduced ? 0 : stagger(0.045), ease: easeOut,
    });
    return () => controls.stop();
  }, [inView, reduced, ready, animate, scope]);
  return <h1 ref={scope} aria-label={children}>{children.split(" ").map((word, i, words) =>
    <span key={`${word}-${i}`} aria-hidden="true"><span className="hero-word">{word}</span>{i < words.length - 1 ? " " : ""}</span>
  )}</h1>;
}

/** A masked word rise gives section changes a distinct rhythm. The server HTML
 * is already readable; only headings that enter the viewport are animated. */
export function SectionTitle({ children }: { children: string }) {
  const [scope, animate] = useAnimate<HTMLHeadingElement>();
  const inView = useInView(scope, { once: true, amount: 0.4, margin: "0px 0px -24px 0px" });
  const { reduced, ready } = usePortfolioMotion();
  const played = useRef(false);
  useEffect(() => {
    if (!scope.current || !ready) return;
    if (reduced) {
      const controls = animate(".section-title-word", { y: "0%", opacity: 1 }, { duration: 0 });
      return () => controls.stop();
    }
    if (!inView || played.current) return;
    played.current = true;
    const controls = animate(".section-title-word", { y: ["105%", "0%"], opacity: [0.65, 1] }, {
      duration: 0.72, delay: stagger(0.045), ease: easeOut,
    });
    return () => controls.stop();
  }, [animate, inView, ready, reduced, scope]);
  return <h2 ref={scope} className="section-title" aria-label={children}>{children.split(" ").map((word, index, words) =>
    <span key={`${word}-${index}`} aria-hidden="true"><span className="section-title-mask"><span className="section-title-word">{word}</span></span>{index < words.length - 1 ? " " : ""}</span>
  )}</h2>;
}

export function SectionHeading({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="section-heading"><SectionTitle>{title}</SectionTitle>
    {children && <Reveal className="section-heading-copy" delay={0.08}><p>{children}</p></Reveal>}
  </div>;
}

export function MotionLink(props: HTMLMotionProps<"a">) {
  const { reduced } = usePortfolioMotion();
  return <motion.a {...props} className={`motion-control ${props.className ?? ""}`}
    whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: 0.97 }}
    whileFocus={reduced ? undefined : { y: -2 }}
    transition={{ type: "spring", stiffness: 460, damping: 30 }} />;
}

export function MotionButton(props: HTMLMotionProps<"button">) {
  const { reduced } = usePortfolioMotion();
  return <motion.button {...props} type={props.type ?? "button"} className={`motion-control ${props.className ?? ""}`}
    whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: 0.96 }}
    whileFocus={reduced ? undefined : { y: -2 }}
    transition={{ type: "spring", stiffness: 460, damping: 30 }} />;
}

export function CopyLabel({ copied, children }: { copied: boolean; children: ReactNode }) {
  const { reduced } = usePortfolioMotion();
  return <span className="copy-label"><AnimatePresence mode="wait" initial={false}>
    <motion.span key={String(copied)} initial={reduced ? false : { y: 5, opacity: 0.6 }}
      animate={{ y: 0, opacity: 1 }} exit={{ y: reduced ? 0 : -5, opacity: 0 }}
      transition={{ type: "tween", duration: reduced ? 0 : 0.14, ease: easeOut }}>{children}</motion.span>
  </AnimatePresence></span>;
}

/** Animate only real values; the accessible text always reports the final number. */
export function AnimatedMetric({ value }: { value: number }) {
  const target = useRef<HTMLSpanElement>(null);
  const inView = useInView(target, { once: true });
  const { reduced } = usePortfolioMotion();
  const number = useMotionValue(value);
  const display = useTransform(number, n => Math.round(n).toLocaleString("en-IN"));
  const played = useRef(false);
  useEffect(() => {
    if (reduced) { number.set(value); return; }
    if (!inView) return;
    if (!played.current) { number.set(0); played.current = true; }
    const controls = animateValue(number, value, { duration: 0.75, ease: easeOut });
    return () => controls.stop();
  }, [inView, reduced, value, number]);
  return <span ref={target}><span className="metric-accessible">{value.toLocaleString("en-IN")}</span><motion.span aria-hidden="true">{display}</motion.span></span>;
}
