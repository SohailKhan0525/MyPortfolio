"use client";

import { AnimatePresence, animate as animateValue, motion, stagger, useAnimate, useInView, useMotionValue, useTransform, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { usePortfolioMotion } from "./MotionPreferences";

export const easeOut = [0.22, 1, 0.36, 1] as const;

/** The server renders the finished content. Motion only begins after it is visible. */
export function Reveal({ children, delay = 0, className = "", sequence = false }: {
  children: ReactNode; delay?: number; className?: string; sequence?: boolean;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { once: true, amount: 0.12 });
  const played = useRef(false);
  const { reduced } = usePortfolioMotion();

  useEffect(() => {
    const node = scope.current;
    if (!node) return;
    const targets = sequence ? Array.from(node.children) : [node];
    if (reduced) {
      animate(targets, { opacity: 1, y: 0 }, { duration: 0 });
      return;
    }
    if (!inView || played.current) return;
    played.current = true;
    const controls = animate(targets, { opacity: [0.6, 1], y: [22, 0] }, {
      duration: 0.65, delay: sequence ? stagger(0.065, { startDelay: delay }) : delay, ease: easeOut,
    });
    return () => controls.stop();
  }, [inView, reduced, sequence, delay, animate, scope]);

  return <div ref={scope} className={`motion-reveal ${className}`}>{children}</div>;
}

export function AnimatedHeading({ children }: { children: string }) {
  const [scope, animate] = useAnimate<HTMLHeadingElement>();
  const { reduced } = usePortfolioMotion();
  const played = useRef(false);
  useEffect(() => {
    if (!scope.current) return;
    if (reduced) { animate(".hero-word", { y: 0, opacity: 1, rotateX: 0 }, { duration: 0 }); return; }
    if (played.current) return;
    played.current = true;
    const controls = animate(".hero-word", { y: [18, 0], opacity: [0.65, 1], rotateX: [12, 0] }, {
      duration: 0.65, delay: stagger(0.035), ease: easeOut,
    });
    return () => controls.stop();
  }, [reduced, animate, scope]);
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
