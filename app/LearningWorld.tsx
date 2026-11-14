"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { gsap } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import "./learning-world.css";

type StationId = "01" | "02" | "03";
type Experiment = "house" | "quake";
type Point = readonly [x: number, y: number];

type Station = {
  id: StationId;
  name: string;
  title: string;
  description: string;
  method: string;
  pin: Point;
  dock: Point;
  // Paths follow the tracks in the 768 × 512 painting, starting at the gravel junction.
  track: string;
  experiment?: { mode: Experiment; label: string };
};

const stations: readonly Station[] = [
  {
    id: "01", name: "House lab", title: "House Price Prediction",
    description: "I convert floor area to square feet, then compare tree models that estimate a home’s price in lakhs.",
    method: "Regression", pin: [164, 252], dock: [246, 273],
    track: "M344 301 C335 302 331 307 322 303 C316 280 279 281 246 273",
    experiment: { mode: "house", label: "Try fitting a line" },
  },
  {
    id: "02", name: "Quake station", title: "Global Earthquake Prediction",
    description: "I use measurements like magnitude and depth to classify whether a recorded earthquake triggered a tsunami.",
    method: "Classification", pin: [510, 158], dock: [478, 166],
    track: "M344 301 C355 299 366 299 372 284 C360 253 413 257 428 233 C447 213 437 190 478 166",
    experiment: { mode: "quake", label: "Try a threshold" },
  },
  {
    id: "03", name: "Pulse lab", title: "Heart Disease Prediction",
    description: "In this classroom project, I encode and scale the inputs, then use logistic regression to predict a class label.",
    method: "Classification", pin: [600, 383], dock: [468, 325],
    track: "M344 301 C356 299 368 291 379 298 C391 309 428 315 468 325",
  },
];

function StationIcon({ id }: { id: StationId }) {
  return <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {id === "01" && <path d="m3 11 9-7.5 9 7.5M5.5 9.5V20H10v-6h4v6h4.5V9.5" />}
    {id === "02" && <path d="M2 13h4l2-4 3.5 10L15 5l2.4 8H22" />}
    {id === "03" && <path d="M20.5 5.8c-2.6-2.7-6.3-1.7-8.5 1.1-2.2-2.8-5.9-3.8-8.5-1.1C.7 9 2.9 13 5.6 15.6L12 21l6.4-5.4c2.7-2.6 4.9-6.6 2.1-9.8Z" />}
  </svg>;
}

/** The little brass sample hauler carries its specimen under a glass dome. */
function SampleRover() {
  return <g className="field-world__vehicle" aria-hidden="true">
    <ellipse cx="0" cy="1.6" rx="19" ry="4.6" fill="#403415" opacity=".28" />
    <g stroke="#37382c" strokeWidth="1.2" strokeLinejoin="round">
      <ellipse cx="-12" cy="-3.2" rx="3.7" ry="4.5" fill="#424c46" />
      <ellipse cx="7" cy="-1.1" rx="3.8" ry="4.5" fill="#444f48" />
      <path fill="#50544a" d="m-17-7 21 2 12-6v5L5 1l-20-3z" />
      <path fill="#d38a38" d="m-18-13 20 1 13-7 2 9L4-2l-20-4z" />
      <path fill="#ffdc79" d="m-18-13 12-7 21 1-13 7z" />
      <path fill="#edaa4d" d="M2-12 15-19l2 9L4-2z" />
      <path fill="#9ed1cb" d="M-11-17v-5a6.9 6.9 0 0 1 13 .3v5.7q-6 3-13-1z" />
      <path d="m-10-17 11 1.2 3-1.7" fill="none" />
      <path d="m10-16 1-9.5" strokeWidth="1.35" />
      <circle cx="11" cy="-26" r="2" fill="#ffbc60" />
      <path d="M-19-7.5l4 .8m20 3.6 10-5.4" fill="none" stroke="#d5dcd4" strokeWidth="1.8" />
    </g>
    <path d="m-6-18-.2-4 2.5-2.5 3 2.8-.4 4z" fill="#38816b" />
    <path d="m-6-18 .9-4.4 1.4-1.7.5 5.8z" fill="#72b49c" />
    <path d="M-8.8-21.5q.4-3.7 3.9-4.4" fill="none" stroke="#f8f6e8" strokeWidth="1.45" strokeLinecap="round" />
    <circle cx="9" cy="-10.2" r="1.75" fill="#fff5ca" /><circle cx="14.4" cy="-13.1" r="1.35" fill="#fff5ca" />
    <path d="m-14-9 7 .8m-6 1.1 6.5.6" fill="none" stroke="#88592f" strokeWidth="1.25" />
  </g>;
}

export default function LearningWorld({ onVisitProject, onTryExperiment }: {
  onVisitProject: (id: string) => void;
  onTryExperiment?: (mode: Experiment) => void;
}) {
  const { reduced } = usePortfolioMotion();
  const [selected, setSelected] = useState(0);
  const infoId = useId();
  const rover = useRef<SVGGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const pins = useRef<(HTMLButtonElement | null)[]>([]);
  const card = useRef<HTMLDivElement>(null);
  // Progress along one branch lets an interrupted trip return continuously to the junction.
  const location = useRef({ branch: 0, progress: 1 });
  const station = stations[selected];
  const experiment = station.experiment;

  useEffect(() => {
    const vehicle = rover.current;
    if (!vehicle) return;
    function park() {
      location.current = { branch: selected, progress: 1 };
      vehicle?.setAttribute("transform", `translate(${station.dock.join(" ")})`);
    }
    if (reduced || document.hidden) { park(); return; }

    const currentBranch = location.current.branch;
    const timeline = gsap.timeline({ onComplete: park });
    const addLeg = (branch: number, start: number, end: number) => {
      const path = paths.current[branch];
      if (!path || typeof path.getTotalLength !== "function" || start === end) return;
      const length = path.getTotalLength();
      const travel = { progress: start };
      timeline.to(travel, {
        progress: end,
        duration: Math.max(.14, Math.abs(start - end) * length / 190),
        ease: "sine.inOut",
        onUpdate() {
          const point = path.getPointAtLength(travel.progress * length);
          location.current = { branch, progress: travel.progress };
          vehicle.setAttribute("transform", `translate(${point.x} ${point.y})`);
        },
      });
    };
    if (currentBranch === selected) {
      addLeg(selected, location.current.progress, 1);
    } else {
      addLeg(currentBranch, location.current.progress, 0);
      addLeg(selected, 0, 1);
    }
    if (!timeline.duration()) park();
    const icon = card.current?.querySelector("[data-station-stamp]");
    const stamp = icon && gsap.fromTo(icon, { scale: .88, rotation: -11 }, {
      scale: 1, rotation: 0, duration: .34, ease: "back.out(1.6)", clearProps: "transform",
    });
    const finishIfHidden = () => { if (document.hidden) timeline.progress(1); };
    document.addEventListener("visibilitychange", finishIfHidden);
    return () => {
      // Killing preserves the live track position when another destination interrupts a trip.
      timeline.kill();
      stamp?.revert();
      document.removeEventListener("visibilitychange", finishIfHidden);
    };
  }, [selected, reduced, station]);

  function visit(index: number) {
    setSelected(index);
  }

  function visitByKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    let next = index;
    switch (event.key) {
      case "ArrowRight": case "ArrowDown": next = (index + 1) % stations.length; break;
      case "ArrowLeft": case "ArrowUp": next = (index + stations.length - 1) % stations.length; break;
      case "Home": next = 0; break;
      case "End": next = stations.length - 1; break;
      default: return;
    }
    event.preventDefault();
    pins.current[next]?.focus({ preventScroll: true });
    visit(next);
  }

  function visitFromPainting(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("button")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = (event.clientX - bounds.left) / bounds.width * 768;
    const y = (event.clientY - bounds.top) / bounds.height * 512;
    // These generous areas include the roof, door and rails closest to each landmark.
    const nearHouse = x < 310 && y > 86 && y < 345;
    const nearQuake = x > 386 && y < 250;
    const nearPulse = x > 410 && y >= 250 && y < 440;
    const index = nearHouse ? 0 : nearQuake ? 1 : nearPulse ? 2 : -1;
    if (index !== -1) visit(index);
  }

  return <section className="field-world" id="field-map" aria-label="Explore the machine learning field lab" tabIndex={-1}>
    <div className="field-world__stage" onClick={visitFromPainting}>
      <img className="field-world__painting" src="/world/learning-lab.webp"
        srcSet="/world/learning-lab-small.webp 768w, /world/learning-lab.webp 1536w"
        sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1360px) 61vw, 850px"
        width={1536} height={1024} fetchPriority="high" decoding="async" draggable={false}
        alt="A miniature pine valley with a terracotta cottage, a seismic observatory and a heart-shaped sign above a clinic. Little railway tracks link the three projects." />
      <svg className="field-world__rails" viewBox="0 0 768 512" aria-hidden="true">
        {stations.map((stop, index) => <path key={stop.id} d={stop.track} fill="none" stroke="none" ref={node => { paths.current[index] = node; }} />)}
        <g ref={rover} transform={`translate(${stations[0].dock.join(" ")})`}><SampleRover /></g>
      </svg>
      <div className="field-world__stops" role="group" aria-label="Project stations. Use arrow keys to switch stations.">
        {stations.map((stop, index) => <button key={stop.id} type="button" ref={node => { pins.current[index] = node; }}
          className="field-world__pin" style={{ left: `${stop.pin[0] / 768 * 100}%`, top: `${stop.pin[1] / 512 * 100}%` }}
          aria-pressed={index === selected} aria-controls={infoId} onClick={() => visit(index)} onKeyDown={event => visitByKeyboard(event, index)}>
          <span className="field-world__sign"><StationIcon id={stop.id} /><span>{stop.name}</span></span>
        </button>)}
      </div>
      <span className="field-world__hint" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 2.5 12 7.6-6 1.1-2.7 5.7z" /></svg>
        Choose a station
      </span>
    </div>
    <div className="field-world__detail" ref={card} id={infoId}>
      <div className="field-world__stamp" data-station-stamp="" aria-hidden="true"><StationIcon id={station.id} /></div>
      <div className="field-world__reading" role="status" aria-live="polite" aria-atomic="true">
        <span className="field-world__method">{station.method}</span>
        <h2 className="field-world__title">{station.title}</h2>
        <p className="field-world__description">{station.description}</p>
      </div>
      <div className="field-world__actions">
        <button type="button" className="field-world__visit" onClick={() => onVisitProject(station.id)}>
          View project <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h11m-4-4 4 4-4 4" /></svg>
        </button>
        {onTryExperiment && experiment && <button type="button" className="field-world__try" onClick={() => onTryExperiment(experiment.mode)}>{experiment.label}</button>}
      </div>
    </div>
  </section>;
}
