"use client";

import { useEffect, useId, useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { gsap } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import { GRID_SIZE, isSameBed, type GardenCell, type Point, type Sample } from "./signal-garden-model";
import "./signal-garden-scene.css";

type SceneProps = {
  size?: number;
  cells: readonly GardenCell[];
  selected: Point;
  goal: Point;
  neighbors: readonly Sample[];
  showNeighbors: boolean;
  goalComplete?: boolean;
  revision: number;
  onSelect: (point: Point) => void;
  onPlant: () => void;
};

// The garden's 7 × 7 data space projects to the diamond on the conservatory floor.
const origin = { x: 384, y: 153 };
const halfTile = { x: 42, y: 21.6 };
const diamond = "M0-21.6 42 0 0 21.6-42 0Z";
const bedKey = (point: Point) => `${point.x}-${point.y}`;
const project = ({ x, y }: Point) => ({ x: origin.x + (x - y) * halfTile.x, y: origin.y + (x + y) * halfTile.y });
const at = (point: Point) => `translate(${point.x} ${point.y})`;
const gardenPlant = (bed: GardenCell) => bed.training ?? bed.prediction;
const plantSize = (bed: GardenCell) => (bed.training ? .88 : .54) + ((bed.x * 17 + bed.y * 7) % 7) * .033;

function Plants({ id }: { id: string }) {
  return <defs>
    <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2=".75" gradientUnits="objectBoundingBox"><stop stopColor="#d2dc86" /><stop offset=".42" stopColor="#83aa55" /><stop offset="1" stopColor="#3e7650" /></linearGradient>
    <linearGradient id={`${id}-leaf-dark`} x1="0" x2="1" y1="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#98bc75" /><stop offset="1" stopColor="#35634a" /></linearGradient>
    <linearGradient id={`${id}-petal`} x1="0" y1="0" x2=".7" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#ffe0a5" /><stop offset=".28" stopColor="#feae75" /><stop offset=".74" stopColor="#ef7951" /><stop offset="1" stopColor="#ce5a41" /></linearGradient>
    <linearGradient id={`${id}-fern-bed`} x1="0" y1="0" x2=".7" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#cbcf91" /><stop offset=".78" stopColor="#a7b67d" /><stop offset="1" stopColor="#9aa777" /></linearGradient>
    <linearGradient id={`${id}-poppy-bed`} x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#e8c296" /><stop offset="1" stopColor="#d6a782" /></linearGradient>
    <g id={`${id}-frond`}>
      <path d="M0 0c-1-11 2-26 8-38" fill="none" stroke="#4a7044" strokeWidth="1.55" strokeLinecap="round" />
      <g fill={`url(#${id}-leaf)`} stroke="#5e8249" strokeWidth=".55" strokeLinejoin="round">
        <path d="M1-7C-5-7-10-13-11-19-4-18 0-13 1-7ZM1-9c3-8 9-11 15-11-3 6-9 10-15 11Z" />
        <path d="M2-15c-5-1-10-6-10-12 6 2 9 6 10 12Zm1-2c3-6 9-9 13-8-3 6-7 8-13 8Z" />
        <path d="M4-23c-5-1-8-6-8-10 5 1 7 5 8 10Zm1-1c2-5 6-7 10-7-2 5-6 7-10 7Z" />
        <path d="M7-30c-3-2-4-6-3-9 3 2 4 5 3 9Zm0-1c0-5 3-11 7-14 1 6-3 11-7 14Z" />
      </g>
      <path d="M0 0c0-13 3-24 7-33" fill="none" stroke="#e2df98" strokeWidth=".85" />
    </g>
    <g id={`${id}-fern`}>
      <use href={`#${id}-frond`} transform="translate(-1 -1) rotate(-57) scale(.66 .68)" />
      <use href={`#${id}-frond`} transform="translate(1 0) rotate(49) scale(.68 .74)" />
      <use href={`#${id}-frond`} transform="rotate(-24) scale(.76 .9)" />
      <use href={`#${id}-frond`} transform="rotate(10) scale(.8 .99)" />
      <path d="M-6 0q5-5 12-1-4 3-12 1Z" fill="#5e7e49" />
    </g>
    <g id={`${id}-bloom`} strokeWidth=".7" strokeLinejoin="round">
      <path fill="#db6a48" stroke="#c76147" d="M-1 2C-7 2-17-5-15-14c3-4 11-2 15 5 3-8 11-12 16-8 5 8-4 18-13 20Z" />
      <path fill={`url(#${id}-petal)`} stroke="#c96742" d="M0 4C-9 1-14-4-12-11c2-5 8-6 12-2 3-5 11-7 14-2 3 6-3 14-14 19Z" />
      <path fill="#f39563" stroke="#db7954" d="M2 4C-5 5-15 0-16-7c2-4 7-5 11-1 3-4 7-4 9-1 2 4 0 9-2 13Z" />
      <path d="M-13-7q4-2 7 1m8-5 4-3" fill="none" stroke="#ffd8a2" strokeWidth="1.3" />
      <ellipse cx="0" cy="-1" rx="3.4" ry="2.2" fill="#594b37" /><ellipse cx="1" cy="-2" rx="1.8" ry="1.1" fill="#edc955" />
    </g>
    <g id={`${id}-poppy`}>
      <path d="M0 0c.2-9 2-21-1-30m1 22c-6-8-10-9-13-11m14 8q9-5 11-13" fill="none" stroke="#5a7950" strokeWidth="2" strokeLinecap="round" />
      <path d="M0-8c-7 0-15-4-16-12 7 1 14 6 16 12Zm1-2c3-7 8-11 14-10-1 6-7 10-14 10Z" fill={`url(#${id}-leaf-dark)`} />
      <path d="M11-22q-2-5 1-8 6-2 7 3 0 5-8 5Z" fill="#92a756" stroke="#708049" strokeWidth=".8" />
      <use href={`#${id}-bloom`} transform="translate(-1 -27) rotate(-7)" />
    </g>
    <g id={`${id}-grain`} fill="#7e724d" opacity=".52"><ellipse cx="-20" cy="3" rx="2.2" ry=".8" /><ellipse cx="11" cy="-6" rx="1.4" ry=".7" /><path d="m8 8 4-1 2 1-4 1zM-16-6l2-1 3 .8-2 1Z" /><circle cx="-3" cy="10" r=".85" /></g>
    <g id={`${id}-stake`} strokeLinejoin="round"><path d="m-1-2 .2-15 2 1-.3 14z" fill="#73573a" /><path d="m-4-24 12 1-1 9-12-1z" fill="#fff1bf" stroke="#785e3e" strokeWidth="1" /><path d="m-2-19 2.4 2.2 4-4" stroke="#536f4d" strokeWidth="1.5" fill="none" /></g>
    <linearGradient id={`${id}-robot-white`} x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#ffffe9" /><stop offset=".58" stopColor="#e4e9ce" /><stop offset="1" stopColor="#a6bd9c" /></linearGradient>
    <linearGradient id={`${id}-robot-mint`} x1="0" x2="1" y1="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#c8ebca" /><stop offset=".4" stopColor="#9aceb2" /><stop offset="1" stopColor="#639d89" /></linearGradient>
    <g id={`${id}-minty`}>
      <g stroke="#57756a" strokeWidth=".95" strokeLinejoin="round">
        <ellipse cx="-7" cy="-2.4" rx="6.7" ry="4.5" fill="#526658" /><ellipse cx="8" cy="-2" rx="6.6" ry="4.2" fill="#526658" />
        <path d="M-15-15q2-10 13-10 15-2 19 10l-1 9q-2 6-11 7l-10-1q-10 0-11-9Z" fill={`url(#${id}-robot-mint)`} />
        <path d="m-6-11 11 1-1 6-8-.1Z" fill="#497068" /><path d="m-3-9 5 .4" stroke="#c5e6bb" strokeWidth="1.7" />
        <path d="M-15-18q-5-2-6 2-2 6 3 9l4-2Z" fill={`url(#${id}-robot-white)`} />
        <path d="M14-18q5-2 6 4l-2 8-4-1Z" fill={`url(#${id}-robot-white)`} />
        <path d="M-19-30q0-16 17-17 17-2 22 12l1 12q-3 12-18 12-21 0-22-12Z" fill={`url(#${id}-robot-white)`} />
        <path d="M-14-31q3-8 12-8 10-1 16 5l1 8q-1 7-10 7l-8-.3q-12 0-12-7Z" fill="#233e38" stroke="#6b8b76" />
        <path d="M-14-39q5-7 14-6" stroke="#fffdec" strokeWidth="2.3" fill="none" strokeLinecap="round" />
        <path d="M-21-29q-3-1-3 4t5 5l1-8Z" fill="#aec9b2" /><path d="M19-30q4-1 5 3l-1 7-4 2Z" fill="#a0bca5" />
      </g>
      <g className="garden-bot-eyes" fill="#c1f6cc"><rect x="-9" y="-31" width="4.6" height="6.9" rx="2.3" /><rect x="5" y="-31" width="4.6" height="6.9" rx="2.3" /></g>
      <path d="M-1-23q2.5 2 5 0" fill="none" stroke="#a4e8b8" strokeWidth="1.25" strokeLinecap="round" />
      <g transform="translate(13 -7) rotate(-8)"><path d="M2-7q-5-7 0-9 5-1 8 5" stroke="#9c6e38" strokeWidth="2.8" fill="none" /><path d="m-1-9 11-2 3 12-13 2z" fill="#d6a34f" stroke="#896d3c" /><path d="m10-6 6 1 6-5 2 2-7 8-6 1" fill="#e3b46a" stroke="#967945" strokeWidth=".9" /><ellipse cx="23" cy="-9" rx="3.4" ry="2.1" fill="#a88c50" transform="rotate(-27 23 -9)" /></g>
    </g>
  </defs>;
}

function PlanterBase() {
  return <g aria-hidden="true">
    <path d="M76 301 384 142 706 297 398 462Z" fill="#705e42" opacity=".27" />
    <path d="m81 283 303-158 303 158-303 157Z" fill="#648273" stroke="#536e5e" strokeWidth="1.2" />
    <path d="m81 283 303 157v12L81 295Z" fill="#557566" />
    <path d="M384 440 687 283v12L384 452Z" fill="#415f52" />
    <path d="m84 286 300 155m2 0 298-154" fill="none" stroke="#acb99c" strokeWidth="1.6" />
    <path d="m84 294 299 154m4 0 296-153" fill="none" stroke="#344f46" opacity=".65" />
    <g fill="#dac79c" stroke="#7d795b" strokeWidth=".7">{[0,1,2,3,4].map(n => <g key={n}><ellipse cx={112+n*60} cy={306+n*31} rx="1.7" ry="1.9" /><ellipse cx={654-n*60} cy={306+n*31} rx="1.7" ry="1.9" /></g>)}</g>
    <g fill="#fff2c9" fontFamily="system-ui, sans-serif" fontSize="10.5" fontWeight="650" letterSpacing=".6">
      <text x="190" y="351" textAnchor="middle" transform="rotate(27.3 190 351)">More light →</text>
      <text x="576" y="351" textAnchor="middle" transform="rotate(-27.3 576 351)">← More water</text>
    </g>
  </g>;
}

function MysteryMarker({ complete }: { complete: boolean }) {
  return <g transform="translate(-14 -2)" className="garden-mystery-marker">
    <path d="m0 1-1-39" stroke="#6d6547" strokeWidth="2.7" strokeLinecap="round" />
    <path d="M-11-53 9-53l3 11-10 8-12-6Z" fill={complete ? "#23664d" : "#ad562c"} stroke="#f9db98" strokeWidth="1.8" />
    <path d={complete ? "m-5-44 3 3 6-7" : "m.4-48 1.8 3.4 3.9.6-2.8 2.7.6 3.9-3.5-1.9-3.5 1.9.7-3.9-2.8-2.7 3.8-.6Z"} fill={complete ? "none" : "#ffdc8b"} stroke={complete ? "#f5ebbb" : "none"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </g>;
}

function roleName(point: Point) { return `${String.fromCharCode(65 + point.x)}${point.y + 1}`; }

export default function SignalGardenScene({ size = GRID_SIZE, cells, selected, goal, neighbors, showNeighbors, goalComplete = false, revision, onSelect, onPlant }: SceneProps) {
  const { reduced } = usePortfolioMotion();
  const id = `garden-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const surface = useRef<SVGSVGElement>(null);
  const actor = useRef<SVGGElement>(null);
  const greeting = useRef<SVGGElement>(null);
  const sprite = useRef<SVGGElement>(null);
  const drops = useRef<SVGGElement>(null);
  const firstPosition = useRef(project(selected));
  const position = useRef({ ...firstPosition.current });
  const oldCells = useRef(cells);
  const lastRevision = useRef(revision);
  const gesture = useRef<{ x: number; y: number; id: number; drag: boolean; touch: boolean; scroll: boolean; last: string } | null>(null);
  const selectedBed = cells.find(cell => isSameBed(cell, selected));
  const ordered = useMemo(() => [...cells].sort((a,b) => (a.x + a.y) - (b.x + b.y) || a.x - b.x), [cells]);

  useEffect(() => {
    const node = actor.current;
    if (!node) return;
    const destination = project(selected);
    const state = position.current;
    const draw = () => node.setAttribute("transform", at(state));
    if (reduced) { Object.assign(state, destination); draw(); return; }
    const distance = Math.hypot(destination.x - state.x, destination.y - state.y);
    if (distance < .1) return;
    const tween = gsap.to(state, { ...destination, duration: Math.min(.7, .13 + distance / 560), ease: "power2.out", onUpdate: draw });
    return () => { tween.kill(); };
  }, [selected.x, selected.y, reduced]);

  useEffect(() => {
    const plantChanged = cells.map((cell, i) => {
      const old = oldCells.current[i];
      return !old || gardenPlant(old) !== gardenPlant(cell) || old.training !== cell.training;
    });
    const watered = revision !== lastRevision.current;
    oldCells.current = cells;
    lastRevision.current = revision;
    const node = surface.current;
    if (!node || reduced || !watered) return;
    const ctx = gsap.context(() => {
      const change = gsap.timeline();
      cells.forEach((cell, i) => {
        if (!plantChanged[i]) return;
        const plant = node.querySelector(`[data-growth="${bedKey(cell)}"]`);
        if (!plant) return;
        const ripple = .09 + Math.hypot(cell.x - selected.x, cell.y - selected.y) * .055;
        change.fromTo(plant, { attr: { transform: "scale(0.42)" }, opacity: .64 }, { attr: { transform: "scale(1)" }, opacity: 1, duration: .5, ease: "back.out(1.5)", clearProps: "opacity" }, ripple);
      });
      if (sprite.current) change.fromTo(sprite.current, { attr: { transform: "rotate(0)" } }, { attr: { transform: "rotate(7)" }, duration: .18, repeat: 1, yoyo: true, ease: "sine.inOut" }, 0);
      if (drops.current) change.fromTo(drops.current.children, { y: -8, opacity: 0 }, { y: 6, opacity: 1, duration: .22, stagger: .045, repeat: 1, yoyo: true, clearProps: "transform,opacity" }, .08);
    }, node);
    return () => ctx.revert();
  }, [cells, revision, reduced]);

  useEffect(() => {
    const node = surface.current;
    if (!node || reduced || !greeting.current) return;
    const body = greeting.current;
    // One short hello after the glasshouse is visible. A hidden page never spends frames on it.
    let timeline: gsap.core.Timeline | undefined;
    function greet() {
      if (timeline || document.hidden) return;
      timeline = gsap.timeline().fromTo(body, { y: 0 }, { y: -4, duration: .27, yoyo: true, repeat: 1, ease: "sine.out", clearProps: "transform" });
    }
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { greet(); observer?.disconnect(); } });
    if (observer) observer.observe(node); else greet();
    return () => { observer?.disconnect(); timeline?.revert(); };
  }, [reduced]);

  function pointAt(clientX: number, clientY: number): Point | null {
    const svg = surface.current;
    const matrix = svg?.getScreenCTM?.();
    if (!svg || !matrix) return null;
    const input = svg.createSVGPoint();
    input.x = clientX; input.y = clientY;
    const pixel = input.matrixTransform(matrix.inverse());
    const horizontal = (pixel.x - origin.x) / halfTile.x;
    const vertical = (pixel.y - origin.y) / halfTile.y;
    const x = Math.round((horizontal + vertical) / 2);
    const y = Math.round((vertical - horizontal) / 2);
    return x >= 0 && x < size && y >= 0 && y < size ? { x, y } : null;
  }

  function selectAt(event: PointerEvent<SVGSVGElement>, skipSame = false, activate = false) {
    const bed = pointAt(event.clientX, event.clientY);
    if (!bed) return;
    const key = bedKey(bed);
    if (skipSame && key === gesture.current?.last) return;
    if (gesture.current) gesture.current.last = key;
    if (!isSameBed(bed, selected)) onSelect(bed);
    else if (activate) onPlant();
  }

  function movePointer(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId || current.scroll) return;
    const dx = Math.abs(event.clientX - current.x), dy = Math.abs(event.clientY - current.y);
    if (!current.drag && Math.max(dx, dy) < 7) return;
    if (!current.drag && current.touch && dy >= dx) { current.scroll = true; return; }
    current.drag = true;
    selectAt(event, true);
  }

  function keyMove(event: KeyboardEvent<SVGSVGElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const directions: Record<string, readonly [number, number]> = { ArrowRight: [1,0], d: [1,0], ArrowDown: [0,1], s: [0,1], ArrowLeft: [-1,0], a: [-1,0], ArrowUp: [0,-1], w: [0,-1] };
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); if (!event.repeat) onPlant(); return; }
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const x = Math.max(0, Math.min(size - 1, selected.x + direction[0]));
    const y = Math.max(0, Math.min(size - 1, selected.y + direction[1]));
    if (x !== selected.x || y !== selected.y) onSelect({x, y});
  }

  return <div className="signal-garden-scene">
    <picture className="garden-conservatory" aria-hidden="true">
      <source media="(max-width: 640px)" srcSet="/garden/conservatory-small.webp" />
      <img src="/garden/conservatory.webp" width="1536" height="1024" alt="" fetchPriority="high" decoding="async" draggable={false} />
    </picture>
    <span id={`${id}-guide`} className="garden-sr-only">Use the arrow keys to move between beds. Press Enter or Space to plant. Each plant shows the prediction for its bed. Stakes mark planted examples. The star marks the mystery bed.</span>
    <svg className="garden-interactive-board" ref={surface} id="signal-garden-board" viewBox="0 0 768 512" preserveAspectRatio="xMidYMid slice"
      role="grid" tabIndex={0} aria-label="Minty’s signal garden" aria-describedby={`${id}-guide`} aria-rowcount={size} aria-colcount={size}
      aria-activedescendant={`${id}-bed-${bedKey(selected)}`} onKeyDown={keyMove}
      onClick={event => {
        if (event.detail !== 0 || !(event.target instanceof Element)) return;
        const key = event.target.closest("[data-garden-bed]")?.getAttribute("data-garden-bed");
        const bed = cells.find(cell => bedKey(cell) === key);
        if (!bed) return;
        if (isSameBed(bed, selected)) onPlant();
        else onSelect({ x: bed.x, y: bed.y });
      }}
      onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; gesture.current = { x:event.clientX,y:event.clientY,id:event.pointerId,drag:false,touch:event.pointerType === "touch",scroll:false,last:"" }; if (event.pointerType === "mouse") event.currentTarget.focus({preventScroll: true}); }}
      onPointerMove={movePointer}
      onPointerCancel={() => { gesture.current = null; }}
      onPointerLeave={event => { if (event.pointerType === "mouse") gesture.current = null; }}
      onPointerUp={event => { const current = gesture.current; if (current?.id === event.pointerId && !current.scroll) selectAt(event, false, !current.drag); gesture.current = null; }}>
      <Plants id={id} />
      <PlanterBase />
      <g aria-hidden="true">{ordered.map(cell => <g key={bedKey(cell)} transform={at(project(cell))}>
        <path d={diamond} fill={`url(#${id}-${gardenPlant(cell)}-bed)`} stroke="#958664" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M-39 0 0-19.9 38.7 0" fill="none" stroke="#f2dab0" strokeWidth="1" opacity=".65" />
        <use href={`#${id}-grain`} transform={`scale(${(cell.x + cell.y) % 2 ? -1 : 1} 1)`} />
      </g>)}</g>
      {showNeighbors && <g className="garden-neighbor-links" aria-hidden="true">{neighbors.map(neighbor => { const a = project(selected), b = project(neighbor); return <g key={bedKey(neighbor)}>
        <path d={`M${a.x} ${a.y}L${b.x} ${b.y}`} stroke="#fdf2bd" strokeWidth="5" fill="none" />
        <path d={`M${a.x} ${a.y}L${b.x} ${b.y}`} stroke="#53644d" strokeWidth="2.1" strokeDasharray="5 4" fill="none" />
        <path d={diamond} transform={at(b)} fill="none" stroke="#fff1b8" strokeWidth="3.3" />
      </g>; })}</g>}
      <g className="garden-selected-bed" transform={at(project(selected))} aria-hidden="true"><path d={diamond} fill="#fff9cb" fillOpacity=".18" stroke="#295344" strokeWidth="5" /><path d={diamond} fill="none" stroke="#fff8bd" strokeWidth="2.8" /></g>
      <g aria-hidden="true">{ordered.map(cell => {
        const key = bedKey(cell), species = gardenPlant(cell), coords = project(cell);
        const mirrored = (cell.x * 2 + cell.y) % 3 === 1 ? -1 : 1;
        return <g key={key} transform={at(coords)}><g transform={`translate(0 2) scale(${plantSize(cell)})`}>
          <ellipse cx="3" cy="1" rx={species === "fern" ? 17 : 13} ry="4.3" fill="#675b3d" opacity=".25" />
          <g data-growth={key}><use href={`#${id}-${species}`} transform={`scale(${mirrored} 1)`} /></g>
        </g>{cell.training && <use href={`#${id}-stake`} transform="translate(15 5) scale(.79)" />}
          {isSameBed(cell,goal) && <MysteryMarker complete={goalComplete} />}
        </g>;
      })}</g>
      <g ref={actor} transform={at(firstPosition.current)} className="garden-rover" aria-hidden="true"><g transform="translate(13 7)">
        <ellipse cx="2" cy="2.8" rx="15.3" ry="4.5" fill="#4b4b35" opacity=".35" />
        <g ref={greeting}><g ref={sprite}><use href={`#${id}-minty`} /></g></g>
        <g ref={drops} fill="#c0e4e2" stroke="#548786" strokeWidth=".6"><path opacity="0" d="m33-11 2-4 .8 3.7q0 2-2 1.7Z" /><path opacity="0" d="m37-8 2-4 .8 3.7q0 2-2 1.7Z" /><path opacity="0" d="m39-4 2-4 .8 3.7q0 2-2 1.7Z" /></g>
      </g></g>
      {Array.from({ length: size }, (_,row) => <g key={row} role="row" aria-rowindex={row + 1}>{cells.filter(bed => bed.y === row).map(bed => <path key={bed.x}
        role="gridcell" id={`${id}-bed-${bedKey(bed)}`} aria-colindex={bed.x+1} aria-selected={isSameBed(bed,selected)}
        aria-label={`${roleName(bed)}, ${bed.training ? `planted ${bed.training}` : `predicted ${bed.prediction}`}${isSameBed(bed,goal) ? ", mystery bed" : ""}`}
        data-garden-bed={bedKey(bed)} transform={at(project(bed))} d={diamond} fill="transparent" />)}</g>)}
    </svg>
    <span className="garden-sr-only" aria-live="polite">{`Minty at ${roleName(selected)}, ${selectedBed?.training ? `planted ${selectedBed.training}` : `predicted ${selectedBed?.prediction ?? "fern"}`}.`}</span>
  </div>;
}
