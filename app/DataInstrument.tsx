"use client";

import { usePortfolioMotion } from "./MotionPreferences";

import { motion, useInView } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import "./data-instrument.css";

/** A conceptual drawing, not a chart of measured model performance. */
export default function DataInstrument() {
  const ref = useRef<HTMLElement>(null);
  const descriptionId = useId();
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const { reduced } = usePortfolioMotion();
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (inView && reduced === false) setRun((current) => current || 1);
  }, [inView, reduced]);

  return (
    <figure ref={ref} className="data-instrument" aria-describedby={descriptionId}>
      <figcaption className="instrument-heading">
        <span className="instrument-title">Data → model → app</span>
        {reduced ? <span className="instrument-static">Static view</span> : (
          <button
            type="button"
            className="instrument-replay"
            onClick={() => setRun((current) => current + 1)}
            aria-label="Trace a record from data through a model into an app"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
              <path d="M3.1 5.5A5 5 0 1 1 3 10M3 2v3.5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Trace a record
          </button>
        )}
      </figcaption>

      <svg className="instrument-drawing" viewBox="0 8 500 88" fill="none" aria-hidden="true">
        <g className="instrument-structure" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Source table: a record rather than an invented dataset. */}
          <rect x="16" y="16" width="98" height="72" rx="3" />
          <path d="M16 33h98M16 51h98M16 69h98M46 33v55M80 33v55" />
          <path d="M25 24h18M54 24h15M87 24h17" className="instrument-ink" />
          <path d="M25 42h12M54 42h16M88 42h12M25 60h12M54 60h16M88 60h12M25 78h12M54 78h16M88 78h12" />
          <rect x="17" y="52" width="96" height="16" className="instrument-tint" stroke="none" />

          {/* The two paths give the moving record a visible, stable route. */}
          <path d="M126 52h60m-5-4 5 4-5 4M310 52h60m-5-4 5 4-5 4" strokeDasharray="2 4" />

          {/* A fitted line, deliberately without a scale or performance claim. */}
          <path d="M202 17v71h98" />
          <path d="M226 85v3m24-3v3m24-3v3M202 64h3m-3-24h3" />
          <path d="m213 76 75-48" className="instrument-signal" />
          <g className="instrument-ink" fill="var(--bg, #080808)">
            <circle cx="219" cy="69" r="3" />
            <circle cx="234" cy="67" r="3" />
            <circle cx="252" cy="48" r="3" />
            <circle cx="270" cy="43" r="3" />
            <circle cx="286" cy="24" r="3" />
          </g>
          <circle cx="248" cy="53" r="4" className="instrument-signal instrument-signal-fill" />

          {/* A small application window, rather than a fabricated screenshot. */}
          <rect x="386" y="16" width="98" height="72" rx="3" />
          <path d="M386 31h98" />
          <circle cx="395" cy="23.5" r="1" /><circle cx="401" cy="23.5" r="1" /><circle cx="407" cy="23.5" r="1" />
          <path d="M398 43h28M398 49h19M398 64h16M398 70h24" />
          <rect x="442" y="42" width="30" height="32" rx="2" className="instrument-tint" />
          <path d="m450 58 5 5 10-12" className="instrument-signal" strokeWidth="1.7" />
        </g>

        {run > 0 && reduced === false && (
          <g key={run}>
            <motion.rect
              x="17" y="52" width="96" height="16" rx="1"
              fill="var(--signal, currentColor)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.2, 0] }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
            <motion.g
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: [0, 0, 184, 184, 368, 368], opacity: [0, 1, 1, 1, 1, 0] }}
              transition={{ duration: 2.2, times: [0, 0.08, 0.44, 0.56, 0.92, 1], ease: [0.4, 0, 0.2, 1] }}
            >
              <circle cx="64" cy="52" r="7" fill="var(--bg, #080808)" />
              <circle cx="64" cy="52" r="3.5" fill="var(--signal, currentColor)" />
            </motion.g>
            <motion.circle
              cx="248" cy="53" r="11" stroke="var(--signal, currentColor)" strokeWidth="1"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0] }}
              transition={{ delay: 0.9, duration: 0.5 }}
            />
            <motion.rect
              x="442" y="42" width="30" height="32" rx="2"
              fill="var(--signal, currentColor)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.22, 0] }}
              transition={{ delay: 1.85, duration: 0.35 }}
            />
          </g>
        )}
      </svg>
      <div className="instrument-labels" aria-hidden="true">
        <span>01 / prepare</span><span>02 / train</span><span>03 / build</span>
      </div>
      <p id={descriptionId} className="instrument-description">A conceptual illustration of a data record moving through a model into an application.</p>
    </figure>
  );
}
