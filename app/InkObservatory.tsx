"use client";

import { useMemo, useState } from "react";
import InkPlate, { makeOpeningInk, type InkStage } from "./InkPlate";
import { classifyInk, INK_EXAMPLES, INK_MISREAD, INK_MODEL_INFO, type InkMatch } from "./ink-model";
import "./ink-observatory.css";

type Sample = { digit: number; pixels: readonly number[] };
type Sheet = { raw: readonly number[] | null; sample: Sample | null };
type Edition = { sheet: Sheet; history: Sheet[]; revision: number };

const plateSize = 32;
const emptySheet: Sheet = { raw: null, sample: null };
const steps: { id: InkStage; label: string }[] = [
  { id: "ink", label: "Ink" }, { id: "pixels", label: "8×8" }, { id: "compare", label: "Match" },
];

function mountSample(sample: Sample): Sheet {
  // Four drawing pixels per source pixel preserve the original 8×8 intensities.
  const raw = Array.from({ length: plateSize * plateSize }, (_, index) => {
    const x = index % plateSize;
    const y = Math.floor(index / plateSize);
    return sample.pixels[Math.floor(y / 4) * 8 + Math.floor(x / 4)];
  });
  return { raw, sample };
}

const startingSheet: Sheet = { raw: makeOpeningInk(), sample: null };
const opening: Edition = { sheet: startingSheet, history: [], revision: 0 };

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={diagonal ? "M3.5 12.5 12 4M5 4h7v7" : "M2 8h11m-4-4 4 4-4 4"} />
    </svg>
  );
}

function Miniature({ pixels }: { pixels: readonly number[] }) {
  return <svg className="ink-slip-mini" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    {pixels.map((ink, index) => ink > 0 && <rect key={index} x={1 + index % 8} y={1 + Math.floor(index / 8)} width="1" height="1" fill="currentColor" fillOpacity={ink} />)}
  </svg>;
}

function ReferenceButton({ match, closest, active, onCompare }: { match: InkMatch; closest: boolean; active: boolean; onCompare: () => void }) {
  return <button type="button" className="ink-slip-match" data-closest={closest} aria-label={`Compare with digit ${match.digit}`}
    aria-pressed={active} onClick={onCompare}>
    <span className="ink-slip-digit" aria-hidden="true">{match.digit}</span>
    <span className="ink-slip-score"><span>{closest ? "Closest reference" : "Distance"}</span><b>{match.distance.toFixed(3)}</b></span>
    <Miniature pixels={match.prototype} />
    <span className="ink-slip-match-arrow"><Arrow diagonal /></span>
  </button>;
}

export default function InkObservatory() {
  const [edition, setEdition] = useState(opening);
  const [stage, setStage] = useState<InkStage>("ink");
  const [referenceIndex, setReferenceIndex] = useState(0);
  const { sample, raw } = edition.sheet;
  const starter = edition.sheet === startingSheet;
  const replaceOnDraw = starter || !!sample;
  const reading = useMemo(() => raw ? classifyInk(raw, plateSize) : null, [raw]);
  const matches = reading?.matches;
  const closest = matches?.[0];
  const selectedReference = matches?.[referenceIndex];
  const misread = !!closest && !!sample && closest.digit !== sample.digit;

  function replaceSheet(sheet: Sheet) {
    setEdition(previous => ({ sheet, history: [...previous.history.slice(-39), previous.sheet], revision: previous.revision + 1 }));
    setStage("ink");
    setReferenceIndex(0);
  }

  function undo() {
    setEdition(previous => {
      const sheet = previous.history[previous.history.length - 1];
      return sheet ? { sheet, history: previous.history.slice(0, -1), revision: previous.revision + 1 } : previous;
    });
    setStage("ink");
    setReferenceIndex(0);
  }

  function loadSample(example: Sample) {
    if (example === sample) {
      setStage("ink");
      setReferenceIndex(0);
    } else {
      replaceSheet(mountSample(example));
    }
  }

  function compare(index: number) {
    setReferenceIndex(index);
    setStage("compare");
  }

  let caption = replaceOnDraw ? "Draw over the example to try your own handwriting." : "Write a single digit. Lift your pen to read it.";
  if (stage === "pixels") caption = "The reader centers your digit and averages the ink into 64 squares.";
  if (stage === "compare") caption = "Teal is your input, copper is the reference, and dark squares show where they overlap.";
  const label = starter ? "Example drawing" : sample ? `Sample labeled ${sample.digit}` : "Your handwriting";
  return (
    <section id="ink-observatory" className="ink-observatory" aria-label="Handwritten digit reader">
      <div className="ink-observatory-instrument">
        <div className="ink-observatory-tools">
          <h2>Draw a digit</h2>
          <div className="ink-observatory-edit">
            <button type="button" onClick={undo} disabled={!edition.history.length}>Undo</button>
            <button type="button" onClick={() => replaceSheet(emptySheet)} disabled={!raw}>Clear</button>
          </div>
        </div>
        <InkPlate stage={stage} raw={raw} pixels={reading?.pixels ?? null} prototype={selectedReference?.prototype ?? null}
          replaceOnDraw={replaceOnDraw} displaySample={!!sample} revision={edition.revision} onDrawStart={() => setStage("ink")}
          onDraw={ink => replaceSheet({ raw: ink, sample: null })} />
        <div className="ink-observatory-optics">
          <div className="ink-observatory-steps" role="group" aria-label="Optical views">
            {steps.map(({ id, label }) => <button key={id} type="button" aria-pressed={stage === id} disabled={!reading && id !== "ink"} onClick={() => setStage(id)}>{label}</button>)}
          </div>
          <p>{caption}</p>
        </div>
      </div>
      <aside className="ink-slip" aria-label="Digit identification slip">
        <div className="ink-slip-head"><h3>The reader’s guess</h3><span className="ink-slip-registration" aria-hidden="true"><i/><i/><i/></span></div>
        <p className="ink-slip-reading" role="status" aria-atomic="true">
          {closest ? <><span className="ink-slip-sr">Closest digit {closest.digit}. </span>{label}{misread && <> · <strong>Misread as {closest.digit}</strong></>}</> : raw ? "Add a little more ink to get a reading." : "Waiting for ink"}
        </p>
        {matches && closest ? (
          <div className="ink-slip-results">
            <ReferenceButton match={closest} closest active={stage === "compare" && referenceIndex === 0} onCompare={() => compare(0)} />
            <div className="ink-slip-runners" role="group" aria-label="Next closest digits">
              {matches.slice(1).map((match, i) => <ReferenceButton key={match.digit} match={match} closest={false} active={stage === "compare" && referenceIndex === i + 1} onCompare={() => compare(i + 1)} />)}
            </div>
          </div>
        ) : <div className="ink-slip-empty"><span aria-hidden="true">—</span><p>Draw on the glass or load a sample to see the three closest digits.</p></div>}
        <p className="ink-slip-hint">{misread ? `The writer drew ${sample.digit}. Compare the references to see what the reader missed.` : "Smaller distances mean a closer match. Select a reference to see the overlap."}</p>
        <div className="ink-slip-samples">
          <div className="ink-slip-sample-heading">Try a sample</div>
          <div className="ink-slip-sample-row" role="group" aria-label="Handwriting samples">
            {INK_EXAMPLES.map(example => <button key={example.digit} type="button" aria-label={`Load sample ${example.digit}`} aria-pressed={sample === example} onClick={() => loadSample(example)}>{example.digit}</button>)}
            <button type="button" className="ink-slip-misread" aria-pressed={sample === INK_MISREAD} onClick={() => loadSample(INK_MISREAD)}>Try a misread <Arrow diagonal/></button>
          </div>
        </div>
        <div className="ink-slip-notes">
          <span>Nearest exemplar · <a href={INK_MODEL_INFO.sourceUrl} target="_blank" rel="noreferrer">UCI Digits</a></span>
          <details><summary>Model notes</summary><p>The reader compares your 64 pixel values with {INK_MODEL_INFO.prototypeCount} handwritten references. Distance is their root-mean-square difference, from 0 to 1. It read {INK_MODEL_INFO.testCorrect} of {INK_MODEL_INFO.testCount} held-out digits correctly.</p>
            <p><a href={INK_MODEL_INFO.sourceUrl} target="_blank" rel="noreferrer">E. Alpaydin &amp; C. Kaynak, UCI (1998)</a>. Samples and derived references are used under <a href={INK_MODEL_INFO.licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0</a>.</p>
          </details>
        </div>
      </aside>
    </section>
  );
}
