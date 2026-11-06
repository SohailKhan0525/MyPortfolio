"use client";

import { useIllustrationTimeline } from "./useIllustrationPlayback";
import "./illustration-motion.css";

import { gsap } from "./gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useId, useRef } from "react";
import "./data-instrument.css";

gsap.registerPlugin(DrawSVGPlugin);

function createInstrumentTimeline(node: HTMLElement) {
  const find = (selector: string) => node.querySelector(selector);
  const timeline = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 3.8, defaults: { ease: "power2.inOut" } });
  timeline.to(find(".instrument-record-row"), { opacity: 0.45, duration: 0.35 }, 0)
    .to(find(".instrument-record-row"), { opacity: 0, duration: 0.55 }, 0.55)
    .set(find(".instrument-record"), { x: 0, opacity: 0 }, 0)
    .to(find(".instrument-record"), { opacity: 1, duration: 0.25 }, 0.1)
    .to(find(".instrument-record"), { x: 184, duration: 1.05 }, 0.35)
    .fromTo(find(".instrument-fit"), { drawSVG: "0%", opacity: 1 }, { drawSVG: "100%", duration: 1.1, immediateRender: false }, 1.1)
    .fromTo(find(".instrument-halo"), { attr: { r: 5 }, opacity: 0.6 }, { attr: { r: 22 }, opacity: 0, duration: 0.8, immediateRender: false }, 1.4)
    .to(find(".instrument-record"), { x: 368, duration: 1.05 }, 1.85)
    .to(find(".instrument-record"), { opacity: 0, duration: 0.3 }, 2.9)
    .to(find(".instrument-output"), { opacity: 0.45, duration: 0.25 }, 2.85)
    .to(find(".instrument-output"), { opacity: 0, duration: 0.55 }, 3.1)
    .fromTo(find(".instrument-check"), { drawSVG: "0%", opacity: 1 }, { drawSVG: "100%", duration: 0.65, immediateRender: false }, 2.9)
    .to(find(".instrument-fit"), { opacity: 0, duration: 0.3 }, 3.4)
    .to(find(".instrument-check"), { opacity: 0, duration: 0.3 }, 3.6);
  node.querySelectorAll(".instrument-labels span").forEach((label, index) => {
    timeline.fromTo(label, { y: 0, opacity: 0.6 }, { y: -3, opacity: 1, duration: 0.3, immediateRender: false }, index * 1.4)
      .to(label, { y: 0, duration: 0.3 }, index * 1.4 + 0.3);
  });
  return timeline;
}

/** A conceptual drawing, not a chart of measured model performance. */
export default function DataInstrument() {
  const ref = useRef<HTMLElement>(null);
  const descriptionId = useId();
  const playback = useIllustrationTimeline(ref, createInstrumentTimeline);
  const { ready, reduced, paused } = playback;

  return (
    <figure ref={ref} className="data-instrument" aria-describedby={descriptionId}>
      <figcaption className="instrument-heading">
        <span className="instrument-title">Data → model → app</span>
        {ready && reduced ? <span className="instrument-static">Reduced motion</span> : (
          <button
            type="button"
            className="instrument-replay illustration-playback"
            onClick={playback.toggle}
            disabled={!ready}
            aria-label={paused ? "Resume data record animation" : "Pause data record animation"}
            title={paused ? "Resume tracing records through the model" : "Pause animation and show the completed diagram"}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
              {paused ? <path d="m5 3 7 5-7 5Z" fill="currentColor" /> : <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2" />}
            </svg>
            {paused ? "Resume trace" : "Pause trace"}
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

        <g>
          <rect className="instrument-record-row" x="17" y="52" width="96" height="16" rx="1" fill="var(--signal, currentColor)" opacity="0" />
          <g className="instrument-record" opacity="0">
            <circle cx="64" cy="52" r="9" fill="var(--bg, #f7f6f0)" />
            <circle cx="64" cy="52" r="5" fill="var(--signal, currentColor)" />
          </g>
          <path className="instrument-fit" d="m213 76 75-48" stroke="var(--signal, currentColor)" strokeWidth="2.5" opacity="0" />
          <circle className="instrument-halo" cx="248" cy="53" r="5" stroke="var(--signal, currentColor)" strokeWidth="1.5" opacity="0" />
          <rect className="instrument-output" x="442" y="42" width="30" height="32" rx="2" fill="var(--signal, currentColor)" opacity="0" />
          <path className="instrument-check" d="m450 58 5 5 10-12" stroke="var(--signal, currentColor)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
        </g>
      </svg>
      <div className="instrument-labels" aria-hidden="true">
        {["01 / prepare", "02 / train", "03 / build"].map(label => <span key={label}>{label}</span>)}
      </div>
      <p id={descriptionId} className="instrument-description">A conceptual illustration of a data record moving through a model into an application.</p>
    </figure>
  );
}
