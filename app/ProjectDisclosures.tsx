"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ArrowUpRight, CaretDown } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import "./sticky-projects.css";

type ProjectRecord = {
  readonly id: string; readonly name: string; readonly tag: string; readonly status: string;
  readonly blurb: string; readonly why: string; readonly stack: readonly string[];
};
type StickyLayout = { mode: "cards" | "headings" | "flow"; top: number };

/** Only intrinsic, non-animated children are observed. No scroll-frame layout reads. */
function useStickyProjects(expanded: string[], reduced: boolean) {
  const stack = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<StickyLayout>({ mode: "flow", top: 96 });
  const expandedKey = expanded.join("|");
  useEffect(() => {
    const root = stack.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".ai-card"));
    const siteHeader = document.querySelector<HTMLElement>(".site-header");
    let frame = 0;
    const measure = () => {
      frame = 0;
      const viewport = window.visualViewport?.height ?? window.innerHeight;
      const baseTop = Math.max(window.innerWidth < 640 ? 82 : 100, (siteHeader?.getBoundingClientRect().height ?? 0) + 16);
      const heightOf = (card: HTMLElement) => {
        const heading = card.querySelector<HTMLElement>(".ai-record-heading");
        const inner = card.querySelector<HTMLElement>(".ai-card-body-inner");
        return (heading?.offsetHeight ?? 0) + (card.dataset.state === "open" ? inner?.scrollHeight ?? 0 : 0) + 2;
      };
      const fullCardsFit = cards.every((card, index) => baseTop + index * 12 + heightOf(card) + 32 < viewport);
      const headingsFit = cards.every(card => baseTop + (card.querySelector<HTMLElement>(".ai-record-heading")?.offsetHeight ?? 0) + 100 < viewport);
      const mode = reduced ? "flow" : fullCardsFit ? "cards" : headingsFit ? "headings" : "flow";
      setLayout(previous => previous.mode === mode && previous.top === baseTop ? previous : { mode, top: baseTop });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    schedule();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    root.querySelectorAll(".ai-record-heading, .ai-card-body-inner").forEach(node => observer?.observe(node));
    if (siteHeader) observer?.observe(siteHeader);
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [expandedKey, reduced]);
  return { stack, layout };
}

function DisclosureBody({ id, open, children }: { id: string; open: boolean; children: ReactNode }) {
  const body = useRef<HTMLDivElement>(null);
  const { ready, reduced } = usePortfolioMotion();
  const first = useRef(true);
  const initialOpen = useRef(open);
  const activeTimeline = useRef<gsap.core.Timeline | null>(null);
  useGSAP(() => {
    const node = body.current;
    if (!node) return;
    activeTimeline.current?.kill();
    const caret = node.closest(".ai-card")?.querySelector(".ai-caret");
    gsap.set(node.querySelectorAll(".ai-card-body-inner > *"), { clearProps: "opacity,transform" });
    if (!ready || reduced || first.current) {
      gsap.set(node, { height: open ? "auto" : 0, opacity: open ? 1 : 0 });
      if (caret) gsap.set(caret, { rotation: open ? 180 : 0 });
      if (ready) first.current = false;
      return;
    }
    const timeline = gsap.timeline({ onComplete: () => ScrollTrigger.refresh() });
    activeTimeline.current = timeline;
    timeline.to(node, { height: open ? "auto" : 0, opacity: open ? 1 : 0,
      duration: open ? .55 : .35, ease: "power3.inOut", overwrite: true }, 0);
    if (caret) timeline.to(caret, { rotation: open ? 180 : 0, duration: .4, ease: "power3.inOut" }, 0);
    if (open) timeline.fromTo(node.querySelectorAll(".ai-card-body-inner > *"), { y: 12, opacity: .4 }, {
      y: 0, opacity: 1, duration: .45, stagger: .06, clearProps: "opacity,transform", ease: "power2.out",
    }, .1);
  }, { scope: body, dependencies: [open, ready, reduced] });
  return <Accordion.Content forceMount asChild id={id}>
    <div ref={body} className="ai-card-body" aria-hidden={!open} inert={!open}
      style={{ height: initialOpen.current ? "auto" : 0, pointerEvents: open ? "auto" : "none", overflow: "hidden" }}>
      {children}
    </div>
  </Accordion.Content>;
}

function ProjectDiagram({ index, stack }: { index: number; stack: readonly string[] }) {
  const labels = stack.slice(0, 3);
  return <div className="ai-project-diagram" aria-hidden="true">
    <svg viewBox="0 0 420 120" fill="none">
      <path className="ai-diagram-path" d="M44 60H376" stroke="var(--line-strong, var(--line))" strokeWidth="1" />
      {[60, 210, 360].map((x, i) => <g key={x}>
        <rect x={x - 23} y="37" width="46" height="46" rx={index === 0 ? 23 : index === 1 ? 2 : 8} fill="var(--surface)" stroke="var(--signal)" />
        <path d={i === 0 ? `M${x - 8} 55h16m-16 10h10` : i === 1 ? `M${x - 8} 60h16m-8-8v16` : `m${x - 7} 60 5 5 10-11`} stroke="var(--signal)" strokeWidth="1.5" />
        <text x={x} y="108" fill="var(--muted)" textAnchor="middle" fontSize="9" fontFamily="var(--font-code)">{labels[i]}</text>
      </g>)}
      <path className="ai-diagram-arrow" d="m130 56 4 4-4 4m150-8 4 4-4 4" stroke="var(--signal)" />
    </svg>
  </div>;
}

export default function ProjectDisclosures({ items }: { items: readonly ProjectRecord[] }) {
  const [expanded, setExpanded] = useState<string[]>(() => items.map(item => item.id));
  const { reduced, ready } = usePortfolioMotion();
  const { stack, layout } = useStickyProjects(expanded, reduced);
  useGSAP(() => {
    const root = stack.current;
    if (!root || !ready || reduced) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".ai-card"));
    cards.forEach((card, index) => {
      const line = card.querySelector(".ai-diagram-path");
      if (line instanceof SVGPathElement) {
        const length = line.getTotalLength();
        gsap.fromTo(line, { strokeDasharray: length, strokeDashoffset: length }, {
          strokeDashoffset: 0, duration: 1.25, ease: "power2.inOut",
          scrollTrigger: { trigger: card, start: "top 82%", once: true },
        });
      }
      const next = cards[index + 1];
      if (layout.mode === "cards" && next) {
        gsap.to(card.querySelector(".ai-card-shell"), {
          scale: .97, transformOrigin: "center top", ease: "none",
          scrollTrigger: { trigger: next, start: "top 75%", end: () => `top ${layout.top + (index + 1) * 12}px`, scrub: .4, invalidateOnRefresh: true },
        });
      }
    });
    ScrollTrigger.refresh();
  }, { scope: stack, dependencies: [ready, reduced, layout.mode, layout.top, items.length], revertOnUpdate: true });

  return <Accordion.Root ref={stack} type="multiple" value={expanded} onValueChange={setExpanded}
    className="ai-era-grid ai-project-stack" data-sticky-mode={layout.mode}
    style={{ "--ai-pin-top": `${layout.top}px` } as CSSProperties}>
    {items.map((item, index) => {
      const open = expanded.includes(item.id);
      const bodyId = `ai-body-${item.id}`;
      return <Accordion.Item key={item.id} value={item.id} asChild>
        <article className="ai-card surface" style={{ "--ai-card-order": index } as CSSProperties}>
          <div className="ai-card-shell">
            <Accordion.Header className="ai-record-heading">
              <Accordion.Trigger className="ai-card-head" data-sound aria-controls={bodyId}>
                <span className="ai-card-index">0{index + 1}<span aria-hidden="true"> / 03</span></span>
                <span className="ai-card-title"><small>{item.tag}</small><strong>{item.name}</strong></span>
                <span className={`ai-status status-${item.id}`}>{item.status}</span>
                <span className="ai-caret" aria-hidden="true"><CaretDown size={18} /></span>
              </Accordion.Trigger>
            </Accordion.Header>
            <DisclosureBody id={bodyId} open={open}>
              <div className="ai-card-body-inner">
                <p className="ai-project-description">{item.blurb}</p>
                <div className="ai-why"><span className="ai-why-label">My role <ArrowUpRight size={14} aria-hidden="true" /></span><p>{item.why}</p></div>
                <ProjectDiagram index={index} stack={item.stack} />
                <div className="stack-row">{item.stack.map(name => <span key={name}>{name}</span>)}</div>
              </div>
            </DisclosureBody>
          </div>
        </article>
      </Accordion.Item>;
    })}
  </Accordion.Root>;
}
