"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Brain, CaretDown } from "@phosphor-icons/react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

type ProjectRecord = {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
  readonly status: string;
  readonly blurb: string;
  readonly why: string;
  readonly stack: readonly string[];
};

export default function ProjectDisclosures({ items }: { items: readonly ProjectRecord[] }) {
  const [expanded, setExpanded] = useState<string[]>(["loopproof"]);
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <LayoutGroup>
      <Accordion.Root type="multiple" value={expanded} onValueChange={setExpanded} className="ai-era-grid">
        {items.map((item, index) => {
          const open = expanded.includes(item.id);
          const bodyId = `ai-body-${item.id}`;
          return (
            <Accordion.Item key={item.id} value={item.id} asChild>
              <motion.article className="ai-card surface" layout={reduced ? false : "position"} initial={false} transition={transition}>
                <Accordion.Header className="ai-record-heading">
                  <Accordion.Trigger className="ai-card-head" data-sound aria-controls={bodyId}>
                    <span className="ai-card-index">0{index + 1}</span>
                    <span className="ai-card-title"><strong>{item.name}</strong><small>{item.tag}</small></span>
                    <span className={`ai-status status-${item.id}`}>{item.status}</span>
                    <motion.span className="ai-caret" initial={false} animate={{ rotate: open ? 180 : 0 }} transition={transition} aria-hidden="true">
                      <CaretDown size={16} />
                    </motion.span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content id={bodyId} className="ai-card-body">
                  <motion.div className="ai-card-body-inner" layout={reduced ? false : "position"} initial={false} transition={transition}>
                    <p>{item.blurb}</p>
                    <div className="ai-why"><Brain size={16} weight="bold" aria-hidden="true" /><p>{item.why}</p></div>
                    <div className="stack-row">{item.stack.map(name => <span key={name}>{name}</span>)}</div>
                  </motion.div>
                </Accordion.Content>
              </motion.article>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </LayoutGroup>
  );
}
