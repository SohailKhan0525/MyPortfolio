"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Brain, CaretDown } from "@phosphor-icons/react";
import { motion, useAnimationControls } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Reveal } from "./MotionElements";
import { usePortfolioMotion } from "./MotionPreferences";

type ProjectRecord = {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
  readonly status: string;
  readonly blurb: string;
  readonly why: string;
  readonly stack: readonly string[];
};

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
  const { reduced } = usePortfolioMotion();
  const ease = [0.22, 1, 0.36, 1] as const;
  const reveal = (open: boolean, order: number) => ({
    duration: reduced ? 0 : open ? 0.32 : 0.16,
    delay: reduced || !open ? 0 : order * 0.045,
    ease,
  });

  return (
      <Accordion.Root type="multiple" value={expanded} onValueChange={setExpanded} className="ai-era-grid">
        {items.map((item, index) => {
          const open = expanded.includes(item.id);
          const bodyId = `ai-body-${item.id}`;
          return (
            <Reveal key={item.id}>
              <Accordion.Item value={item.id} asChild>
                <article className="ai-card surface">
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
            </Reveal>
          );
        })}
      </Accordion.Root>
  );
}
