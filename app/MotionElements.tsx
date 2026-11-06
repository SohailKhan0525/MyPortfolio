"use client";
import { useRef, type ReactNode, type ComponentPropsWithoutRef, type RefObject } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
gsap.registerPlugin(SplitText);
export const easeOut = "power3.out";

export function Reveal({ children, delay = 0, className = "", sequence = false, variant = "lift" }: {
  children: ReactNode; delay?: number; className?: string; sequence?: boolean; variant?: "lift" | "panel" | "slide";
}) {
  const scope = useRef<HTMLDivElement>(null);
  const { ready, reduced } = usePortfolioMotion();
  useGSAP(() => {
    if (!ready || reduced || !scope.current) return;
    gsap.fromTo(Array.from(scope.current.children),
      { opacity: .5, x: variant === "slide" ? 20 : 0, y: variant === "slide" ? 0 : 32 },
      { opacity: 1, x: 0, y: 0, duration: .85, ease: easeOut,
        delay: Math.min(delay, .18), stagger: sequence ? .08 : 0, immediateRender: false,
        scrollTrigger: { trigger: scope.current, start: "top 94%", once: true }, clearProps: "transform,opacity" });
  }, { scope, dependencies: [ready, reduced, delay, sequence, variant], revertOnUpdate: true });
  return <div ref={scope} className={`motion-reveal ${className}`}>
    {sequence ? children : <div className="motion-reveal-content">{children}</div>}
  </div>;
}

export function MotionSection({ children, ...props }: ComponentPropsWithoutRef<"section">) {
  const scope = useRef<HTMLElement>(null);
  const { ready, reduced } = usePortfolioMotion();
  useGSAP(() => {
    if (!ready || reduced || !scope.current?.querySelector(".section-rule > span")) return;
    gsap.fromTo(".section-rule > span", { scaleX: 0 }, { scaleX: 1, duration: 1.15, ease: "power2.inOut",
      immediateRender: false, scrollTrigger: { trigger: scope.current, start: "top 90%", once: true } });
  }, { scope, dependencies: [ready, reduced], revertOnUpdate: true });
  return <section {...props} ref={scope}>
    {props.className?.includes("section-block") && <span className="section-rule" aria-hidden="true"><span /></span>}
    {children}
  </section>;
}

function useHeadline(scope: RefObject<HTMLHeadingElement | null>, hero: boolean) {
  const { ready, reduced } = usePortfolioMotion();
  useGSAP(() => {
    if (!ready || reduced || !scope.current) return;
    SplitText.create(scope.current, {
      type: "lines", mask: "lines", autoSplit: true, linesClass: "editorial-line",
      onSplit(self) {
        return gsap.fromTo(self.lines,
          { yPercent: hero ? 18 : 102, opacity: hero ? .8 : .4, rotation: hero ? 0 : 1 },
          { yPercent: 0, opacity: 1, rotation: 0, duration: hero ? 1.15 : .95,
            stagger: .1, ease: "power4.out", immediateRender: false,
            scrollTrigger: { trigger: scope.current, start: "top 94%", once: true } });
      },
    });
  }, { scope, dependencies: [ready, reduced, hero], revertOnUpdate: true });
}
export function AnimatedHeading({ children }: { children: string }) {
  const ref = useRef<HTMLHeadingElement>(null); useHeadline(ref, true);
  return <h1 ref={ref}>{children}</h1>;
}
export function SectionTitle({ children }: { children: string }) {
  const ref = useRef<HTMLHeadingElement>(null); useHeadline(ref, false);
  return <h2 ref={ref} className="section-title">{children}</h2>;
}
export function SectionHeading({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="section-heading"><SectionTitle>{title}</SectionTitle>
    {children && <Reveal className="section-heading-copy" delay={.08}><p>{children}</p></Reveal>}
  </div>;
}

function useControl<T extends HTMLElement>(ref: RefObject<T | null>) {
  const { ready, reduced } = usePortfolioMotion();
  useGSAP(() => {
    const node = ref.current;
    if (!node || !ready || reduced) return;
    const options = { duration: .25, ease: "power2.out" };
    const yTo = gsap.quickTo(node, "y", options);
    const scaleXTo = gsap.quickTo(node, "scaleX", options);
    const scaleYTo = gsap.quickTo(node, "scaleY", options);
    const icon = node.querySelector("svg");
    const iconX = icon ? gsap.quickTo(icon, "x", options) : null;
    const iconY = icon ? gsap.quickTo(icon, "y", options) : null;
    const animate = (y: number, scale: number) => {
      yTo(y); scaleXTo(scale); scaleYTo(scale);
      iconX?.(y < 0 ? 2 : 0); iconY?.(y < 0 ? -2 : 0);
    };
    const enter = () => { if (window.matchMedia("(hover: hover)").matches) animate(-2, 1); };
    const leave = () => animate(0, 1);
    const down = () => animate(0, .97);
    const focus = () => animate(-2, 1);
    node.addEventListener("pointerenter", enter); node.addEventListener("pointerleave", leave);
    node.addEventListener("pointerdown", down); node.addEventListener("pointerup", leave);
    node.addEventListener("pointercancel", leave); node.addEventListener("focus", focus); node.addEventListener("blur", leave);
    return () => {
      node.removeEventListener("pointerenter", enter); node.removeEventListener("pointerleave", leave);
      node.removeEventListener("pointerdown", down); node.removeEventListener("pointerup", leave);
      node.removeEventListener("pointercancel", leave); node.removeEventListener("focus", focus); node.removeEventListener("blur", leave);
    };
  }, { scope: ref, dependencies: [ready, reduced], revertOnUpdate: true });
}
export function MotionLink(props: ComponentPropsWithoutRef<"a">) {
  const ref = useRef<HTMLAnchorElement>(null); useControl(ref);
  return <a {...props} ref={ref} className={`motion-control ${props.className ?? ""}`} />;
}
export function MotionButton(props: ComponentPropsWithoutRef<"button">) {
  const ref = useRef<HTMLButtonElement>(null); useControl(ref);
  return <button {...props} ref={ref} type={props.type ?? "button"} className={`motion-control ${props.className ?? ""}`} />;
}
export function CopyLabel({ copied, children }: { copied: boolean; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = usePortfolioMotion();
  useGSAP(() => {
    if (!reduced) gsap.fromTo(ref.current, { y: 4, opacity: .6 }, { y: 0, opacity: 1, duration: .22, clearProps: "transform,opacity" });
  }, { scope: ref, dependencies: [copied, reduced], revertOnUpdate: true });
  return <span className="copy-label"><span ref={ref}>{children}</span></span>;
}
export function AnimatedMetric({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { ready, reduced } = usePortfolioMotion();
  useGSAP(() => {
    if (!ready || reduced || !ref.current) return;
    const node = ref.current.querySelector<HTMLElement>("[aria-hidden]")!;
    const count = { value: 0 };
    gsap.to(count, { value, duration: 1.2, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 95%", once: true },
      onUpdate: () => { node.textContent = Math.round(count.value).toLocaleString("en-IN"); },
      onComplete: () => { node.textContent = value.toLocaleString("en-IN"); } });
    return () => { node.textContent = value.toLocaleString("en-IN"); };
  }, { scope: ref, dependencies: [ready, reduced, value], revertOnUpdate: true });
  return <span ref={ref}><span className="metric-accessible">{value.toLocaleString("en-IN")}</span><span aria-hidden="true">{value.toLocaleString("en-IN")}</span></span>;
}
