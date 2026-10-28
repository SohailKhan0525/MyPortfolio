"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Brain, CaretDown } from "@phosphor-icons/react";
import { motion, useAnimationControls } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePortfolioMotion } from "./MotionPreferences";
import "./sticky-projects.css";

type ProjectRecord = {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
  readonly status: string;
  readonly blurb: string;
  readonly why: string;
  readonly stack: readonly string[];
};

type StickyLayout = { mode: "cards" | "headings" | "flow"; tops: number[] };

/** Native sticky positions do the scrolling. Measure intrinsic content only when
 * it changes; observing the animated height would cause a layout read per frame. */
function useStickyProjects(count: number) {
  const stack = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<StickyLayout>({ mode: "headings", tops: [] });

  useEffect(() => {
    const root = stack.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".ai-card"));
    const siteHeader = document.querySelector<HTMLElement>(".site-header");
    let frame = 0;

    const measure = () => {
      frame = 0;
      const viewport = window.visualViewport?.height ?? window.innerHeight;
      const configuredTop = parseFloat(getComputedStyle(root).getPropertyValue("--portfolio-sticky-top")) || 96;
      const baseTop = Math.max(configuredTop, (siteHeader?.getBoundingClientRect().height ?? 0) + 12);
      const sizes = cards.map(card => ({
        head: card.querySelector<HTMLElement>(".ai-record-heading")?.getBoundingClientRect().height ?? 0,
        // Include closed bodies so opening a disclosure never changes the pin mode.
        body: card.querySelector<HTMLElement>(".ai-card-body-inner")?.getBoundingClientRect().height ?? 0,
      }));
      let nextTop = baseTop;
      const tops = sizes.map(({ head }) => {
        const top = nextTop;
        nextTop += head + 8;
        return top;
      });
      const mode = sizes.every(({ head, body }, index) => tops[index] + head + body + 24 <= viewport)
        ? "cards"
        : sizes.every(({ head }) => baseTop + head + 80 <= viewport) ? "headings" : "flow";
      const positions = mode === "cards" ? tops : sizes.map(() => baseTop);
      setLayout(previous => previous.mode === mode && previous.tops.length === positions.length
        && previous.tops.every((top, index) => top === positions[index])
        ? previous : { mode, tops: positions });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    for (const element of root.querySelectorAll(".ai-record-heading, .ai-card-body-inner")) observer.observe(element);
    if (siteHeader) observer.observe(siteHeader);
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [count]);

  return { stack, layout };
}

/** A preference change must also stop a disclosure already in motion. */
function DisclosureBody({ id, open, reduced, children }: {
  id: string; open: boolean; reduced: boolean; children: ReactNode;
}) {
  const controls = useAnimationControls();

  useEffect(() => {
    const target = { height: open ? "auto" : 0, opacity: open ? 1 : 0 };
    if (reduced) controls.set(target);
    else void controls.start(target, {
      height: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: open ? 0.24 : 0.16 },
    });
    return () => controls.stop();
  }, [controls, open, reduced]);

  return <Accordion.Content forceMount asChild id={id}>
    <motion.div
      className="ai-card-body"
      initial={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
      animate={controls}
      aria-hidden={!open}
      inert={!open}
      style={{ pointerEvents: open ? "auto" : "none", overflow: "hidden" }}
    >{children}</motion.div>
  </Accordion.Content>;
}

export default function ProjectDisclosures({ items }: { items: readonly ProjectRecord[] }) {
  const [expanded, setExpanded] = useState<string[]>(["loopproof"]);
  const { stack, layout } = useStickyProjects(items.length);
  const { reduced } = usePortfolioMotion();
  const ease = [0.22, 1, 0.36, 1] as const;
  const reveal = (open: boolean, order: number) => ({
    duration: reduced ? 0 : open ? 0.32 : 0.16,
    delay: reduced || !open ? 0 : order * 0.045,
    ease,
  });

  return (
      <Accordion.Root ref={stack} type="multiple" value={expanded} onValueChange={setExpanded}
        className="ai-era-grid ai-project-stack" data-sticky-mode={layout.mode}>
        {items.map((item, index) => {
          const open = expanded.includes(item.id);
          const bodyId = `ai-body-${item.id}`;
          return (
              <Accordion.Item key={item.id} value={item.id} asChild>
                <article className="ai-card surface" style={{
                  "--ai-pin-top": layout.tops[index] === undefined ? "var(--portfolio-sticky-top)" : `${layout.tops[index]}px`,
                  "--ai-stack-order": index + 1,
                } as CSSProperties}>
                  <Accordion.Header className="ai-record-heading">
                    <Accordion.Trigger className="ai-card-head" data-sound aria-controls={bodyId}>
                      <span className="ai-card-index">0{index + 1}</span>
                      <span className="ai-card-title"><strong>{item.name}</strong><small>{item.tag}</small></span>
                      <span className={`ai-status status-${item.id}`}>{item.status}</span>
                      <motion.span className="ai-caret" initial={false} animate={{ rotate: open ? 180 : 0 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 30 }} aria-hidden="true">
                        <CaretDown size={16} />
                      </motion.span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  {/* Keep the controlled region mounted for a continuous close animation.
                      inert and aria-hidden remove closed content from keyboard/AT access. */}
                  <DisclosureBody id={bodyId} open={open} reduced={reduced}>
                      <div className="ai-card-body-inner">
                        <motion.p initial={false} animate={{ y: reduced || open ? 0 : 8, opacity: open ? 1 : 0 }} transition={reveal(open, 0)}>{item.blurb}</motion.p>
                        <motion.div className="ai-why" initial={false} animate={{ y: reduced || open ? 0 : 8, opacity: open ? 1 : 0 }} transition={reveal(open, 1)}><Brain size={16} weight="bold" aria-hidden="true" /><p>{item.why}</p></motion.div>
                        <motion.div className="stack-row" initial={false} animate={{ y: reduced || open ? 0 : 6, opacity: open ? 1 : 0 }} transition={reveal(open, 2)}>{item.stack.map(name => <span key={name}>{name}</span>)}</motion.div>
                      </div>
                  </DisclosureBody>
                </article>
              </Accordion.Item>
          );
        })}
      </Accordion.Root>
  );
}
