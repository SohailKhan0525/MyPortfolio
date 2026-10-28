"use client";

import { useIllustrationPlayback } from "./useIllustrationPlayback";
import "./illustration-motion.css";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

const ink = "var(--text)";
const secondary = "var(--text2, var(--muted))";
const line = "var(--line)";
const signal = "var(--signal, var(--text))";
const wash = "var(--signal-soft, var(--surface))";

const descriptions = [
  "An architectural house drawing beside an illustrative regression plot.",
  "Terrain contours, a marked epicenter, and an illustrative seismic wave.",
  "A heart silhouette and a diagram connecting input features to a classifier.",
  "Layered student records and a linked index of profiles.",
  "An illustrative decision boundary separating two groups of student outcomes.",
  "An isometric bank vault beside an open transaction ledger.",
  "A directory tree connecting a folder to Python and JSON files.",
];

function Label({ x, y, children, anchor = "start" }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end" }) {
  return <text x={x} y={y} fill={secondary} stroke="none" fontFamily="var(--font-code, monospace)" fontSize="10" letterSpacing="1" textAnchor={anchor}>{children}</text>;
}

function Registration({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 4} ${y}h8 M${x} ${y - 4}v8`} stroke={line} />;
}

const ease = [0.22, 1, 0.36, 1] as const;

function Accent({ d, draw, delay = 0.7 }: { d: string; draw: boolean; delay?: number }) {
  return <motion.path d={d} fill="none" stroke={signal} strokeWidth="2" initial={draw ? { pathLength: 0 } : false}
    animate={{ pathLength: draw ? [0, 1] : 1 }} transition={{ type: "tween", duration: draw ? 1.8 : 0, delay: draw ? delay : 0, ease }} />;
}

/** Each short study settles into its complete drawing between visible replays. */
function Arrive({ draw, delay = 0, children }: { draw: boolean; delay?: number; children: ReactNode }) {
  return <motion.g initial={draw ? { opacity: 0.15, y: 12 } : false} animate={{ opacity: draw ? [0.15, 1] : 1, y: draw ? [12, 0] : 0 }}
    transition={{ type: "tween", duration: draw ? 0.9 : 0, delay: draw ? delay : 0, ease }}>{children}</motion.g>;
}

function Pulse({ x, y, draw, delay = 0, radius = 30 }: { x: number; y: number; draw: boolean; delay?: number; radius?: number }) {
  return <motion.circle cx={x} cy={y} fill="none" stroke={signal} strokeWidth="1.5" initial={draw ? { r: 5, opacity: 0 } : false}
    animate={{ r: draw ? [5, radius] : radius, opacity: draw ? [0, 0.85, 0] : 0 }}
    transition={{ type: "tween", duration: draw ? 1.45 : 0, delay: draw ? delay : 0, ease: "easeOut" }} />;
}

function House({ draw }: { draw: boolean }) {
  const dots = [[364, 146], [388, 154], [400, 129], [418, 134], [437, 111], [457, 112], [470, 85], [492, 88], [513, 65]];
  return <>
    <path d="M70 159 158 202 272 146 185 103Z" stroke={line} strokeDasharray="3 5" />
    <Arrive draw={draw}>
      <path d="m103 102 64 32 76-38-64-32Z" fill={wash} />
      <path d="M103 102v61l64 32 76-38V96 M167 134v61 M103 102l64 32 76-38 M103 102l34-53 65 32 41 15 M137 49l63-31 43 78 M202 81l-35 53" />
    </Arrive>
    <path d="m200 18 43 22v56 M205 46v-22l14 7v22" stroke={secondary} />
    <path d="m120 127 18 9v23l-18-9Z M182 143l18-9v42l-18 9Z M215 126l13-7v18l-13 7Z" />
    <path d="m109 167 52 26 M173 196l64-32 M76 113v52 M72 113h8 M72 165h8" stroke={line} />
    <Label x={90} y={215}>AREA / FEATURES</Label>
    <path d="M342 44v130h194 M342 130h194 M342 86h194" stroke={line} />
    <Label x={342} y={31}>REGRESSION</Label>
    {dots.map(([x, y], i) => <Arrive key={i} draw={draw} delay={0.2 + i * 0.1}><circle cx={x} cy={y} r="3" fill={i % 3 === 0 ? wash : "var(--surface)"} stroke={secondary} /></Arrive>)}
    <Accent d="M357 160 523 59" draw={draw} delay={1.1} />
    <Pulse x={513} y={65} draw={draw} delay={2.35} radius={18} />
    <Label x={536} y={194} anchor="end">FEATURE SPACE</Label>
  </>;
}

function Earthquake({ draw }: { draw: boolean }) {
  return <>
    <g stroke={secondary} opacity=".65">
      <path d="M50 154C70 110 41 92 76 64S134 62 163 36s69-9 99 10 19 58 36 83-6 57-49 66-74-13-112 1-80-7-87-42Z" />
      <path d="M76 148c13-35-11-48 16-69s44-8 72-27 54-5 78 8 16 42 32 65-6 40-39 48-60-14-91-3-61 4-68-22Z" />
      <path d="M101 143c5-24-9-37 11-49s33-5 55-19 35-4 54 7 14 29 24 46-6 28-29 30-43-12-65-6-46 7-50-9Z" />
      <path d="M127 128c0-15-3-21 11-28s21-1 35-8 24 0 30 11 15 20 12 29-25 8-37 3-37 9-51-7Z" />
    </g>
    <path d="M56 34v152 M86 34h180 M56 186h210" stroke={line} strokeDasharray="2 7" />
    <circle cx="172" cy="114" r="27" fill={wash} stroke={signal} strokeWidth="1" />
    <circle cx="172" cy="114" r="5" fill={signal} stroke="none" />
    <Pulse x={172} y={114} draw={draw} radius={68} />
    <Pulse x={172} y={114} draw={draw} delay={0.65} radius={68} />
    <path d="M172 77v14 M172 137v14 M135 114h14 M195 114h14" stroke={signal} />
    <path d="M208 114h98l18-29h212" stroke={line} />
    <Label x={338} y={54}>SIGNAL / CLASSIFICATION</Label>
    <path d="M332 105v76 M332 143h218" stroke={line} />
    <Accent d="M335 143h25l8-6 7 11 9-20 9 35 9-66 10 78 10-50 9 27 9-20 9 15 9-6h38l6-4 6 6h20" draw={draw} />
    <Label x={72} y={215}>TERRAIN STUDY</Label>
    <Label x={549} y={201} anchor="end">ILLUSTRATIVE WAVE</Label>
  </>;
}

function Heart({ draw }: { draw: boolean }) {
  return <>
    <motion.g initial={draw ? { scale: 1 } : false} style={{ transformBox: "view-box", originX: "168px", originY: "120px" }}
      animate={{ scale: draw ? [1, 1.07, 1, 1.04, 1] : 1 }}
      transition={{ type: "tween", duration: draw ? 1.7 : 0, ease: "easeInOut" }}>
      <path d="M168 186C138 170 92 145 91 105c-1-30 20-51 47-48 14 1 24 9 30 20 7-11 18-19 33-20 27-2 46 20 45 48-2 38-45 65-78 81Z" fill={wash} strokeWidth="1.6" />
      <path d="M111 107c-1-19 12-31 27-30 M168 95v70" stroke={secondary} />
    </motion.g>
    <path d="M63 32h210 M63 202h210 M76 23v18 M260 23v18" stroke={line} />
    <Label x={168} y={28} anchor="middle">HEALTH / FEATURES</Label>
    <path d="M300 68h44 M300 110h44 M300 152h44 M344 68v84 M344 110h41 M457 110h57" stroke={line} />
    {[68, 110, 152].map((y, i) => <Arrive key={y} draw={draw} delay={0.25 + i * 0.18}>
      <circle cx="292" cy={y} r="5" fill={i === 1 ? wash : "var(--surface)"} />
      <path d={`M276 ${y - 9}h-17 M276 ${y}h-29 M276 ${y + 9}h-21`} stroke={line} />
    </Arrive>)}
    <path d="m421 74 36 36-36 36-36-36Z" fill={wash} />
    <path d="M410 110h22 M421 99v22" stroke={signal} />
    <rect x="514" y="91" width="38" height="38" rx="7" />
    <circle cx="533" cy="110" r="7" fill={wash} stroke={signal} />
    <Accent d="M300 110h85 M457 110h57" draw={draw} />
    <Pulse x={533} y={110} draw={draw} delay={2.1} radius={24} />
    <Label x={421} y={177} anchor="middle">CLASSIFIER</Label>
    <Label x={533} y={177} anchor="middle">OUTPUT</Label>
  </>;
}

function Student({ draw }: { draw: boolean }) {
  return <>
    <path d="M94 55V28h161v151h-25 M79 70V43h161v151h-25" stroke={secondary} />
    <rect x="64" y="58" width="161" height="151" rx="4" fill="var(--surface)" />
    <path d="M64 94h161" stroke={line} />
    <Label x={81} y={81}>STUDENT RECORD</Label>
    <circle cx="94" cy="123" r="8" fill={wash} stroke={signal} />
    <path d="M81 147c0-12 26-12 26 0 M122 119h79 M122 131h54 M81 164h120 M81 182h75" stroke={secondary} />
    <path d="M270 60h56 M298 60v105h28 M326 60h30 M326 165h30 M326 60v105" stroke={line} />
    {[{ x: 356, y: 30 }, { x: 458, y: 30 }, { x: 356, y: 135 }, { x: 458, y: 135 }].map(({ x, y }, i) => <Arrive key={i} draw={draw} delay={0.65 + i * 0.32}>
      <rect x={x} y={y} width="73" height="64" rx="5" fill={i === 0 ? wash : "none"} stroke={i === 0 ? signal : secondary} />
      <circle cx={x + 21} cy={y + 23} r="6" />
      <path d={`M${x + 11} ${y + 42}c0-11 20-11 20 0 M${x + 41} ${y + 22}h19 M${x + 41} ${y + 34}h13`} stroke={secondary} />
    </Arrive>)}
    <path d="M429 60h29 M429 165h29" stroke={line} />
    <Accent d="M270 60h86 M298 60v105h58 M429 60h29 M429 165h29" draw={draw} delay={0.3} />
    <Pulse x={94} y={123} draw={draw} delay={2} radius={22} />
    <Label x={447} y={117} anchor="middle">RECORD INDEX</Label>
  </>;
}

function Outcomes({ draw }: { draw: boolean }) {
  const a = [[94, 134], [111, 109], [135, 126], [150, 88], [167, 107], [123, 157], [177, 68]];
  const b = [[211, 139], [231, 106], [251, 121], [270, 91], [241, 156], [281, 140], [262, 61]];
  return <>
    <path d="M63 31v154h242" stroke={line} />
    {a.map(([x, y], i) => <Arrive key={i} draw={draw} delay={i * 0.08}><circle cx={x} cy={y} r="4" stroke={secondary} /></Arrive>)}
    {b.map(([x, y], i) => <Arrive key={i} draw={draw} delay={0.3 + i * 0.08}><path d={`m${x} ${y - 5} 5 5-5 5-5-5Z`} fill={wash} stroke={signal} /></Arrive>)}
    <Accent d="M165 185C199 142 179 99 220 34" draw={draw} />
    <Label x={63} y={210}>TWO OUTCOME GROUPS</Label>
    <path d="M329 112h34 M363 112V67h34 M363 112v45h34" stroke={line} />
    <Arrive draw={draw} delay={1.6}>
      <rect x="397" y="42" width="139" height="50" rx="5" fill={wash} />
      <path d="m413 67 5 5 11-12" stroke={signal} strokeWidth="2" />
      <Label x={447} y={71}>PASS</Label>
    </Arrive>
    <Arrive draw={draw} delay={1.95}>
      <rect x="397" y="132" width="139" height="50" rx="5" />
      <path d="m414 151 12 12 M426 151l-12 12" stroke={secondary} />
      <Label x={447} y={161}>FAIL</Label>
    </Arrive>
    <Label x={465} y={210} anchor="middle">CLASSIFICATION</Label>
  </>;
}

function Bank({ draw }: { draw: boolean }) {
  return <>
    <path d="m77 62 42-29 132 24-42 29Z" fill={wash} />
    <path d="M77 62 209 86v118L77 180Z M77 62l42-29 132 24v118l-42 29 M209 86l42-29" />
    <path d="m94 83 97 18v81l-97-18Z" stroke={secondary} />
    <ellipse cx="143" cy="132" rx="24" ry="30" transform="rotate(-11 143 132)" fill={wash} />
    <motion.g initial={draw ? { rotate: -75 } : false} style={{ transformBox: "view-box", originX: "143px", originY: "132px" }} animate={{ rotate: draw ? [-75, 0] : 0 }} transition={{ type: "tween", duration: draw ? 1.6 : 0, ease }}>
      <ellipse cx="143" cy="132" rx="7" ry="9" transform="rotate(-11 143 132)" stroke={signal} />
      <path d="m143 123-3-14 M149 130l13-4 M148 139l8 14 M137 136l-13 6" stroke={secondary} />
    </motion.g>
    <path d="M104 92v9 M104 150v9 M220 103l19-13v51l-19 13Z" stroke={secondary} />
    <path d="M324 59c31-13 59-11 91 5 33-16 63-18 94-5v126c-34-12-65-9-94 6-28-14-58-17-91-6Z" fill="var(--surface)" />
    <path d="M415 64v127 M337 78c24-6 43-4 65 5 M337 99c24-6 43-4 65 5 M337 120c24-6 43-4 65 5 M337 141c24-6 43-4 65 5 M428 83c23-9 44-11 68-5 M428 104c23-9 44-11 68-5 M428 125c23-9 44-11 68-5 M428 146c23-9 44-11 68-5" stroke={line} />
    <Accent d="M337 99c24-6 43-4 65 5 M428 104c23-9 44-11 68-5" draw={draw} delay={1} />
    <Accent d="M337 141c24-6 43-4 65 5 M428 146c23-9 44-11 68-5" draw={draw} delay={1.65} />
    <Label x={417} y={30} anchor="middle">RECORDS / OPERATIONS</Label>
    <path d="M270 128h30 M294 123l6 5-6 5" stroke={secondary} />
  </>;
}

function Files({ draw }: { draw: boolean }) {
  return <>
    <path d="M67 83V53a5 5 0 0 1 5-5h50l16 19h82a5 5 0 0 1 5 5v20" stroke={secondary} />
    <path d="M60 83h169l-15 96H77Z" fill={wash} />
    <path d="m91 120-8 8 8 8 M120 120l8 8-8 8 M109 117l-9 23" stroke={signal} strokeWidth="2" />
    <Label x={80} y={202}>WORKSPACE /</Label>
    <path d="M238 127h46 M284 47v129 M284 47h57 M284 112h57 M284 176h57" stroke={line} />
    {[{ y: 25, label: "main.py", ext: "PY" }, { y: 90, label: "records.json", ext: "{}" }, { y: 155, label: "README.md", ext: "MD" }].map(({ y, label, ext }, i) => <Arrive key={label} draw={draw} delay={0.6 + i * 0.4}>
      <path d={`M341 ${y}h27l11 11v36h-38Z M368 ${y}v11h11`} fill="var(--surface)" />
      <text x="348" y={y + 33} fill={secondary} stroke="none" fontFamily="var(--font-code, monospace)" fontSize="9">{ext}</text>
      <Label x={399} y={y + 28}>{label}</Label>
    </Arrive>)}
    <Accent d="M238 127h46V47h57 M284 112h57 M284 127v49h57" draw={draw} delay={0.25} />
    <circle cx="284" cy="127" r="3" fill={signal} stroke="none" />
  </>;
}

const scenes = [House, Earthquake, Heart, Student, Outcomes, Bank, Files];

/** Original vector studies of the project subjects, not screenshots or model results. */
export default function ProjectIllustration({ index }: { index: number }) {
  const drawing = useRef<SVGSVGElement>(null);
  const inView = useInView(drawing, { amount: 0.2, margin: "0px 0px -8% 0px" });
  const safeIndex = Number.isInteger(index) && index >= 0 && index < scenes.length ? index : 0;
  const playback = useIllustrationPlayback(inView, 6800, safeIndex);
  const Scene = scenes[safeIndex];
  return (
    <>
    <svg ref={drawing} className="project-drawing" viewBox="0 0 600 220" role="img" aria-label={descriptions[safeIndex]} style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }} fill="none" stroke={ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <Registration x={18} y={18} />
      <Registration x={582} y={18} />
      <Registration x={18} y={202} />
      <Registration x={582} y={202} />
      <Scene key={`${safeIndex}-${playback.run}`} draw={playback.playing} />
    </svg>
    {playback.ready && playback.reduced ? <span className="illustration-static">Reduced motion</span> : (
      <motion.button type="button" className="illustration-playback" onClick={playback.toggle}
        disabled={!playback.ready}
        aria-label={playback.paused ? "Resume project illustration animation" : "Pause project illustration animation"}
        title={playback.paused ? "Resume the animated study" : "Pause animation and show the completed drawing"}
        whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 420, damping: 28 }}>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {playback.paused ? <path d="m5 3 7 5-7 5Z" fill="currentColor" /> : <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2" />}
        </svg>
        {playback.paused ? "Resume drawing" : "Pause drawing"}
      </motion.button>
    )}
    </>
  );
}
