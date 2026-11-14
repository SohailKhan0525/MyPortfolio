"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { gsap } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import "./ink-plate.css";

export type InkStage = "ink" | "pixels" | "compare";

type InkPlateProps = {
  stage: InkStage;
  raw: readonly number[] | null;
  pixels: readonly number[] | null;
  prototype: readonly number[] | null;
  replaceOnDraw: boolean;
  displaySample?: boolean;
  revision: number;
  onDrawStart: () => void;
  onDraw: (raw: number[]) => void;
};

type Point = { x: number; y: number };
type Stroke = { source: number | "keyboard"; pixels: number[]; point: Point; line: string };

const SIDE = 32;
const BRUSH = 1.38;
const INPUT_COLOR = [24, 91, 88];
const REFERENCE_COLOR = [172, 79, 36];
const SHARED_COLOR = [40, 45, 38];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));
const unit = (v: number | undefined) => clamp(Number(v) || 0, 0, 1);
const coord = ({ x, y }: Point) => `${x.toFixed(2)} ${y.toFixed(2)}`;

// Distance to the segment also covers a quick flick between sparse touch events.
function inkSegment(pixels: number[], from: Point, to: Point) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const extent = dx * dx + dy * dy;
  const pad = BRUSH + .5;
  const x0 = Math.max(0, Math.floor(Math.min(from.x, to.x) - pad));
  const x1 = Math.min(SIDE - 1, Math.ceil(Math.max(from.x, to.x) + pad));
  const y0 = Math.max(0, Math.floor(Math.min(from.y, to.y) - pad));
  const y1 = Math.min(SIDE - 1, Math.ceil(Math.max(from.y, to.y) + pad));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const u = x + .5 - from.x, v = y + .5 - from.y;
      const t = extent ? clamp((u * dx + v * dy) / extent, 0, 1) : 0;
      const strength = clamp(pad - Math.hypot(u - t * dx, v - t * dy), 0, 1);
      const i = y * SIDE + x;
      pixels[i] = Math.max(pixels[i], strength);
    }
  }
}

// The opening seven is a stroke on the same glass as a visitor's handwriting.
export function makeOpeningInk(): number[] {
  const points: Point[] = [
    [7, 8], [11, 7], [16, 7.2], [21, 7.5], [25, 7.4],
    [23, 10], [20, 14], [17, 18], [15, 22], [13.5, 26],
  ].map(([x, y]) => ({ x, y }));
  const pixels = new Array<number>(SIDE * SIDE).fill(0);
  for (let i = 1; i < points.length; i++) inkSegment(pixels, points[i-1], points[i]);
  return pixels;
}

// Combine horizontal runs. The preloaded ink is present in server-rendered HTML.
function rawLayers(raw: readonly number[] | null, displaySample: boolean) {
  const paths = Array.from({ length: 8 }, () => "");
  if (!raw) return paths;
  // Archival examples were recorded on an 8 × 8 sensor. Interpolate only the
  // optical display; the classifier still receives their exact intensities.
  const sampleAt = (x: number, y: number) => {
    if (!displaySample) return unit(raw[y * SIDE + x]);
    const u = clamp((x + .5) / 4 - .5, 0, 7), v = clamp((y + .5) / 4 - .5, 0, 7);
    const i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
    const read = (col: number, row: number) => unit(raw[Math.min(row, 7) * 4 * SIDE + Math.min(col, 7) * 4]);
    return (1-b) * ((1-a) * read(i,j) + a * read(i+1,j)) + b * ((1-a) * read(i,j+1) + a * read(i+1,j+1));
  };
  for (let y = 0; y < SIDE; y++) {
    for (let x = 0; x < SIDE;) {
      const start = x;
      const level = Math.round(sampleAt(x++, y) * paths.length);
      while (x < SIDE && Math.round(sampleAt(x, y) * paths.length) === level) x++;
      if (level) paths[level - 1] += `M${start} ${y}h${x - start}v1H${start}z`;
    }
  }
  return paths;
}

function PlatePixels({ pixels, prototype, compare }: Pick<InkPlateProps, "pixels" | "prototype"> & { compare: boolean }) {
  return <g data-ink-pixels={compare ? "compare" : "input"} transform="translate(2.4 2.4) scale(.85)">
    {Array.from({ length: 64 }, (_, i) => {
      const own = unit(pixels?.[i]);
      const ref = compare ? unit(prototype?.[i]) : 0;
      const shared = Math.min(own, ref);
      const strongest = Math.max(own, ref);
      const color = compare && strongest > 0
        ? `rgb(${SHARED_COLOR.map((channel, k) => Math.round((channel * shared + INPUT_COLOR[k] * (own - shared) + REFERENCE_COLOR[k] * (ref - shared)) / strongest)).join(",")})`
        : "#303b30";
      const x = i % 8 * 4, y = Math.floor(i / 8) * 4;
      return <g key={i}>
        <rect x={x + .06} y={y + .06} width="3.88" height="3.88" fill="none" stroke="#51482f" strokeOpacity=".18" strokeWidth=".065" />
        {strongest > 0 && <rect x={x + .1} y={y + .1} width="3.8" height="3.8" fill={color} opacity={strongest} />}
      </g>;
    })}
  </g>;
}

export default function InkPlate({ stage, raw, pixels, prototype, replaceOnDraw, displaySample = false, revision, onDrawStart, onDraw }: InkPlateProps) {
  const id = `ink-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { reduced } = usePortfolioMotion();
  const liveLine = useRef<SVGPathElement>(null);
  const sweep = useRef<SVGGElement>(null);
  const active = useRef<Stroke | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [hideBase, setHideBase] = useState(false);
  const [keyPen, setKeyPen] = useState<Point>({ x: 16.5, y: 8.5 });
  const [keyboardDrawing, setKeyboardDrawing] = useState(false);
  const previous = useRef({ revision, stage });
  const layers = useMemo(() => rawLayers(raw, displaySample), [raw, displaySample]);
  const inInk = drawing || stage === "ink";

  useEffect(() => {
    const changed = previous.current.revision !== revision || previous.current.stage !== stage;
    previous.current = { revision, stage };
    if (!changed || reduced || !raw || active.current || !sweep.current) return;
    const el = sweep.current;
    const scan = gsap.timeline();
    scan.set(el, { opacity: 0, attr: { transform: "translate(0 0)" } })
      .to(el, { opacity: .8, duration: .08 })
      .to(el, { attr: { transform: "translate(0 32)" }, duration: .5, ease: "power1.inOut" }, 0)
      .to(el, { opacity: 0, duration: .11 }, .4);
    return () => { scan.revert(); };
  }, [revision, stage, raw, reduced]);

  function begin(source: Stroke["source"], point: Point) {
    if (active.current) return;
    const values = !replaceOnDraw && raw ? Array.from(raw) : new Array<number>(SIDE * SIDE).fill(0);
    inkSegment(values, point, point);
    const line = `M${coord(point)}l.001 0`;
    active.current = { source, pixels: values, point, line };
    liveLine.current?.setAttribute("d", line);
    setHideBase(replaceOnDraw);
    setDrawing(true);
    setKeyboardDrawing(source === "keyboard");
    onDrawStart();
  }

  function extend(point: Point) {
    const stroke = active.current;
    if (!stroke || (point.x === stroke.point.x && point.y === stroke.point.y)) return;
    inkSegment(stroke.pixels, stroke.point, point);
    stroke.point = point;
    stroke.line += `L${coord(point)}`;
  }

  function finish(commit: boolean) {
    const stroke = active.current;
    if (!stroke) return;
    active.current = null;
    liveLine.current?.setAttribute("d", "");
    setDrawing(false);
    setHideBase(false);
    setKeyboardDrawing(false);
    if (commit) onDraw(stroke.pixels);
  }

  function localPoint(rect: DOMRect, x: number, y: number): Point {
    return { x: (x - rect.left) * SIDE / rect.width, y: (y - rect.top) * SIDE / rect.height };
  }

  function pointerStart(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || event.isPrimary === false || active.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic input can lack a pointer capture target. */ }
    begin(event.pointerId, localPoint(rect, event.clientX, event.clientY));
  }

  function pointerMove(event: PointerEvent<SVGSVGElement>) {
    const stroke = active.current;
    if (!stroke || stroke.source !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const coalesced = event.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const sample of coalesced) extend(localPoint(rect, sample.clientX, sample.clientY));
    extend(localPoint(rect, event.clientX, event.clientY));
    liveLine.current?.setAttribute("d", stroke.line);
  }

  function keyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.altKey || event.metaKey || event.ctrlKey || (active.current && active.current.source !== "keyboard")) return;
    if (event.key === " " || event.key === "Enter" || event.key === "Escape") {
      if (event.key !== " " && !active.current) return;
      event.preventDefault();
      if (event.repeat) return;
      if (active.current) finish(event.key !== "Escape");
      else begin("keyboard", keyPen);
      return;
    }
    const deltas: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const d = deltas[event.key];
    if (!d) return;
    event.preventDefault();
    const step = event.shiftKey ? 3 : 1;
    const point = { x: clamp(keyPen.x + step * d[0], .5, SIDE - .5), y: clamp(keyPen.y + step * d[1], .5, SIDE - .5) };
    setKeyPen(point);
    if (active.current) {
      extend(point);
      liveLine.current?.setAttribute("d", active.current.line);
    }
  }

  return <div className="ink-chamber">
    <div className="ink-chamber-viewport">
      <div className="ink-chamber-camera">
        <picture className="ink-chamber-art" aria-hidden="true">
          <source media="(max-width: 640px)" srcSet="/ink/observatory-small.webp 768w, /ink/observatory.webp 1536w" sizes="(max-width: 450px) 630px, 750px" />
          <img src="/ink/observatory.webp" width="1536" height="1024" alt="" fetchPriority="high" decoding="async" draggable={false} />
        </picture>
        <svg className="ink-plate-surface" data-ink-stage={inInk ? "ink" : stage} viewBox="0 0 32 32"
          role="application" tabIndex={0} aria-label="Handwriting glass. Draw one digit." aria-describedby={`${id}-guide`}
          onPointerDown={pointerStart} onPointerMove={pointerMove}
          onPointerUp={event => { if (active.current?.source === event.pointerId) { pointerMove(event); finish(true); } }}
          onPointerCancel={event => { if (active.current?.source === event.pointerId) finish(false); }}
          onLostPointerCapture={event => { if (active.current?.source === event.pointerId) finish(false); }}
          onKeyDown={keyDown} onBlur={() => { if (active.current?.source === "keyboard") finish(true); }}>
          <defs>
            <filter id={`${id}-soft`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation=".32" /></filter>
            <linearGradient id={`${id}-beam`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#96ceb1" stopOpacity="0" /><stop offset="1" stopColor="#a5e1bf" stopOpacity=".48" /></linearGradient>
          </defs>
          {inInk && !hideBase && <g data-ink-raw="" fill="#28392e" filter={`url(#${id}-soft)`}
            transform={displaySample ? "translate(3 3) scale(.8125)" : undefined}>
            {layers.map((d, i) => d && <path key={i} d={d} opacity={(i + 1) / 8} />)}
          </g>}
          {!inInk && <PlatePixels pixels={pixels} prototype={prototype} compare={stage === "compare"} />}
          <path ref={liveLine} data-ink-stroke="" fill="none" stroke="#28392e" strokeWidth={2 * BRUSH} strokeLinecap="round" strokeLinejoin="round" />
          <g ref={sweep} data-ink-scan="" opacity="0" pointerEvents="none">
            <rect x="0" y="-2.8" width="32" height="2.8" fill={`url(#${id}-beam)`} />
            <path d="M0 0h32" stroke="#3e7b65" strokeWidth=".16" />
          </g>
          <g className="ink-key-pen" transform={`translate(${coord(keyPen)})`} pointerEvents="none">
            <circle r="1.62" fill={keyboardDrawing ? "#2c6852" : "none"} fillOpacity=".25" stroke="#fff1bd" strokeWidth=".37" />
            <path d="M-2.7 0h1.15m3.1 0H2.7M0-2.7v1.15m0 3.1V2.7" fill="none" stroke="#244c3b" strokeWidth=".25" />
          </g>
        </svg>
      </div>
      <span className="ink-pen-cue" aria-hidden="true">Arrow keys move the pen. Space starts or ends a stroke.</span>
    </div>
    <span id={`${id}-guide`} className="ink-access-text">Draw on the glass with a finger, pen or mouse. With the keyboard, use the arrows to move, and Space to lower or lift the pen. Hold Shift to move faster. Escape cancels a stroke. You can also choose a digit example below.</span>
    <span className="ink-access-text" aria-live="polite">{keyboardDrawing ? "Pen down." : ""}</span>
  </div>;
}
