"use client";

import { useMemo, useState } from "react";
import SignalGardenScene from "./SignalGardenScene";
import {
  GRID_SIZE, MYSTERY_BED, SEED_SAMPLES, classifyBed, gardenCells, isSameBed, plantSample,
  type Point, type Sample, type Species,
} from "./signal-garden-model";
import "./signal-garden.css";

const startingBed: Point = { x: 3, y: 2 };

function PlantMark({ species }: { species: Species }) {
  if (species === "fern") return (
    <svg className="garden-plant-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 27 25 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M11 22C8 22 5 18 5 14c4 1 7 3 8 6Zm4-5c-4-2-5-6-4-10 4 2 5 5 5 8Zm5-5c-2-3-2-6 1-10 2 4 2 7 0 9ZM12 22c4-4 8-5 13-3-3 4-8 5-13 4Zm6-8c4-3 8-4 12-2-3 3-7 4-12 3Z" fill="currentColor" />
    </svg>
  );
  return (
    <svg className="garden-plant-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 29c-1-4 1-8 0-13m0 9c3-4 6-4 9-4-2 4-4 5-9 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 5c2-4 8-4 9 0 5-1 8 5 4 9-1 5-6 7-11 5-4 3-10 2-12-3C1 14 2 7 7 6c2-4 6-4 9-1Z" fill="currentColor" />
      <g fill="var(--garden-paper)"><circle cx="14.5" cy="13" r="1.25"/><circle cx="18" cy="13.5" r="1.1"/><circle cx="16" cy="10.4" r="1.1"/></g>
    </svg>
  );
}

function StarMark() {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m12 2.5 2.8 5.7 6.3.9-4.5 4.4 1.1 6.3-5.7-3-5.7 3 1.1-6.3L3 9.1l6.2-.9Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>;
}

function bedName(point: Point) {
  return `${String.fromCharCode(65 + point.x)}${point.y + 1}`;
}

type GardenEdits = { samples: readonly Sample[]; history: (readonly Sample[])[]; revision: number };

export default function SignalGarden({ onExploreClassifier }: { onExploreClassifier?: () => void } = {}) {
  const [edits, setEdits] = useState<GardenEdits>({ samples: SEED_SAMPLES, history: [], revision: 0 });
  const [selected, setSelected] = useState<Point>(startingBed);
  const [seed, setSeed] = useState<Species>("poppy");
  const [showNeighbors, setShowNeighbors] = useState(false);
  const [notice, setNotice] = useState("");

  const cells = useMemo(() => gardenCells(edits.samples), [edits.samples]);
  const classification = useMemo(() => classifyBed(edits.samples, selected), [edits.samples, selected]);
  const goalComplete = useMemo(() => classifyBed(edits.samples, MYSTERY_BED).species === "poppy", [edits.samples]);
  const planted = edits.samples.find(sample => isSameBed(sample, selected));
  const reserved = isSameBed(selected, MYSTERY_BED);
  const plantDisabled = reserved || planted?.species === seed;
  const plantLabel = reserved ? "Choose a nearby bed" : planted?.species === seed ? `${seed === "fern" ? "Fern" : "Poppy"} already planted` : `Plant a ${seed}`;
  const coordinates = bedName(selected);

  function visitBed(point: Point) {
    setSelected(previous => isSameBed(previous, point) ? previous : point);
    setNotice("");
  }

  function plant() {
    if (plantDisabled) return;
    setEdits(previous => {
      const samples = plantSample(previous.samples, selected, seed);
      if (samples === previous.samples) return previous;
      // Each plant is a small immutable dataset. Bound undo memory during open-ended play.
      return { samples, history: [...previous.history.slice(-63), previous.samples], revision: previous.revision + 1 };
    });
    const updated = gardenCells(plantSample(edits.samples, selected, seed));
    const changed = updated.filter((cell, index) => cell.prediction !== cells[index].prediction).length;
    const planting = `Planted a ${seed} at ${coordinates}.`;
    setNotice(changed ? `${planting} ${changed} ${changed === 1 ? "bed changed its prediction" : "beds changed their prediction"}.` : `${planting} Zero beds changed their prediction.`);
  }

  function undo() {
    setEdits(previous => {
      const samples = previous.history[previous.history.length - 1];
      return samples ? { samples, history: previous.history.slice(0, -1), revision: previous.revision + 1 } : previous;
    });
    setNotice("Last planting undone.");
  }

  function reset() {
    setEdits(previous => ({ samples: SEED_SAMPLES, history: [], revision: previous.revision + 1 }));
    setSelected(startingBed);
    setSeed("poppy");
    setShowNeighbors(false);
    setNotice("Original garden restored.");
  }

  function visitGoal() {
    visitBed(MYSTERY_BED);
    setShowNeighbors(true);
    document.getElementById("signal-garden-board")?.focus();
  }

  const voteCount = classification.votes[classification.species];
  const voterSpecies = classification.species === "fern" ? "ferns" : "poppies";
  return (
    <section className="signal-garden" id="signal-garden" aria-label="Play the signal garden">
      <div className="signal-garden-layout">
        <div className="garden-world">
          <SignalGardenScene size={GRID_SIZE} cells={cells} selected={selected} goal={MYSTERY_BED}
            neighbors={classification.neighbors} showNeighbors={showNeighbors} goalComplete={goalComplete}
            onSelect={visitBed} onPlant={plant} revision={edits.revision} />
          <div className="garden-scene-foot">
            <span className="garden-feedback" role="status" aria-live="polite" aria-atomic="true">{notice || "Tap a bed to move. Tap it again to plant. Flags mark examples."}</span>
            <span className="garden-key-hint"><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> move <kbd>Enter</kbd> plant</span>
          </div>
        </div>
        <div className="garden-console">
          <div className="garden-console-main">
            <fieldset className="garden-packets">
              <legend>Plant an example</legend>
              <div className="garden-packet-row">
                {(["fern", "poppy"] as const).map(species => (
                  <label className="garden-packet" data-species={species} key={species}>
                    <input type="radio" name="garden-seeds" value={species} checked={seed === species}
                      onChange={() => { setSeed(species); setNotice(""); }} />
                    <span className="garden-packet-face"><PlantMark species={species} />{species === "fern" ? "Fern" : "Poppy"}<i aria-hidden="true" /></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="garden-plant-row">
              <button className="garden-plant-button" type="button" disabled={plantDisabled} onClick={plant}>{plantLabel}
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M10 4v12M4 10h12" strokeLinecap="round" /></svg>
              </button>
              <button type="button" className="garden-tool" title="Undo last planting" aria-label="Undo last planting" disabled={!edits.history.length} onClick={undo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M8 6 3 11l5 5M3 11h11a6 6 0 0 1 0 12" transform="translate(0 -2)" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button type="button" className="garden-tool" title="Reset garden" aria-label="Reset garden" onClick={reset}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M20 10a8 8 0 1 0-.9 7.4M20 4v6h-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
          <div className="garden-inspection">
            <div className="garden-read-key"><span>Bed {coordinates}</span><span>{planted ? `Planted ${planted.species}` : reserved ? "Starred bed" : "Unplanted bed"}</span></div>
            <p className="garden-vote" aria-live="polite" aria-atomic="true"><strong>Minty guesses {classification.species}.</strong> {voteCount} of the 3 nearest examples are {voterSpecies}.</p>
            <label className="garden-neighbors"><input type="checkbox" checked={showNeighbors} onChange={event => setShowNeighbors(event.target.checked)} />Show the three neighbors</label>
          </div>
          <div className="garden-notebook" data-complete={goalComplete}>
            <StarMark /><div>
              <p role="status">{goalComplete ? "You changed the starred bed’s guess to poppy." : "Can you make the starred bed predict poppy?"}</p>
              {goalComplete && onExploreClassifier ? <button type="button" onClick={onExploreClassifier}>Explore my earthquake study</button> : <button type="button" onClick={visitGoal}>Find the starred bed</button>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
