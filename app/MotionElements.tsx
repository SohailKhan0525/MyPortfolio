"use client";

import { AnimatePresence, animate as animateValue, motion, stagger, useAnimate, useInView, useMotionValue, useScroll, useSpring, useTransform, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { usePortfolioMotion } from "./MotionPreferences";

export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Observe the actual visible block, not an ancestor containing a mobile stack.
 * Content remains readable before hydration, on exit, and with reduced motion. */
export function Reveal({ children, delay = 0, className = "", sequence = false }: {
  children: ReactNode; delay?: number; className?: string; sequence?: boolean;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { amount: "some", margin: "0px 0px -48px 0px" });
  const { reduced, ready } = usePortfolioMotion();

  useEffect(() => {
    const node = scope.current;
    if (!node || !ready) return;
    // Observe the stationary wrapper and move only its children. Moving the
    // observed node itself can retrigger IntersectionObserver at a scroll edge.
    const targets = Array.from(node.children);
    if (!inView) {
      animate(targets, { opacity: 1, y: 0 }, { duration: 0 });
      return;
    }
    const controls = animate(targets, { opacity: reduced ? [0.65, 1] : [0.12, 1], y: reduced ? 0 : [32, 0] }, {
      duration: reduced ? 0.28 : 0.85, delay: reduced ? 0 : sequence ? stagger(0.09, { startDelay: delay }) : delay, ease: easeOut,
    });
    return () => controls.stop();
  }, [inView, reduced, ready, sequence, delay, animate, scope]);

  return <div ref={scope} className={`motion-reveal ${className}`}>
    {sequence ? children : <div className="motion-reveal-content">{children}</div>}
  </div>;
}

/** The rule follows native scrolling; it also works without a mouse or hover. */
export function MotionSection({ children, ...props }: Omit<HTMLMotionProps<"section">, "children"> & { children: ReactNode }) {
  const target = useRef<HTMLElement>(null);
  const { reduced } = usePortfolioMotion();
  const { scrollYProgress } = useScroll({ target, offset: ["start 92%", "start 30%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 32, restDelta: 0.001 });
  return <motion.section {...props} ref={target}>
    {props.className?.includes("section-block") && <span className="section-rule" aria-hidden="true"><motion.span style={{ scaleX: reduced ? 1 : progress }} /></span>}
    {children}
  </motion.section>;
}

export function AnimatedHeading({ children }: { children: string }) {
  const [scope, animate] = useAnimate<HTMLHeadingElement>();
  const inView = useInView(scope, { amount: 0.2 });
  const { reduced, ready } = usePortfolioMotion();
  useEffect(() => {
    if (!scope.current || !ready) return;
    if (!inView) { animate(".hero-word", { y: 0, opacity: 1, rotateX: 0 }, { duration: 0 }); return; }
    const controls = animate(".hero-word", { y: reduced ? 0 : [32, 0], opacity: reduced ? [0.65, 1] : [0.1, 1], rotateX: reduced ? 0 : [20, 0] }, {
      duration: reduced ? 0.28 : 0.85, delay: reduced ? 0 : stagger(0.055), ease: easeOut,
    });
    return () => controls.stop();
  }, [inView, reduced, ready, animate, scope]);
  return <h1 ref={scope} aria-label={children}>{children.split(" ").map((word, i, words) =>
    <span key={`${word}-${i}`} aria-hidden="true"><span className="hero-word">{word}</span>{i < words.length - 1 ? " " : ""}</span>
  )}</h1>;
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
