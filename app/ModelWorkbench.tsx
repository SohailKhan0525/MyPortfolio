"use client";

import { useId, useState } from "react";
import HouseFitExperiment from "./HouseFitExperiment";
import "./model-workbench.css";

const quakeRecords = [
  { id: "A", score: 0.18, tsunami: false },
  { id: "B", score: 0.34, tsunami: true },
  { id: "C", score: 0.45, tsunami: false },
  { id: "D", score: 0.50, tsunami: true },
  { id: "E", score: 0.72, tsunami: false },
  { id: "F", score: 0.88, tsunami: true },
] as const;

function QuakeThresholdExperiment() {
  const titleId = useId();
  const thresholdId = useId();
  const [threshold, setThreshold] = useState(0.5);
  const records = quakeRecords.map(record => ({
    ...record,
    flagged: record.score >= threshold,
  }));
  const falseAlerts = records.filter(record => record.flagged && !record.tsunami).length;
  const missed = records.filter(record => !record.flagged && record.tsunami).length;
  const detected = records.filter(record => record.flagged && record.tsunami).length;

  return (
    <section className="quake-threshold" aria-labelledby={titleId}>
      <h3 id={titleId}>Which quake records get flagged?</h3>
      <p>These six invented records pair a model score with whether a tsunami occurred. A score at or above your threshold raises an alert.</p>
      <div className="quake-threshold-label">
        <label htmlFor={thresholdId}>Alert threshold</label>
        <span>{threshold.toFixed(2)}</span>
      </div>
      <input id={thresholdId} type="range" min="0" max="1" step="0.01" value={threshold}
        aria-valuetext={threshold.toFixed(2)}
        onChange={event => setThreshold(event.currentTarget.valueAsNumber)} />
      <table aria-label="Model calls and observed outcomes for six synthetic quake records">
        <thead>
          <tr>
            <th scope="col">Record</th><th scope="col">Score</th>
            <th scope="col">Tsunami observed</th><th scope="col">Model call</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id}>
              <th scope="row">{record.id}</th>
              <td className="quake-number">{record.score.toFixed(2)}</td>
              <td>{record.tsunami ? "Yes" : "No"}</td>
              <td data-flagged={record.flagged}>{record.flagged ? "Alert" : "No alert"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="quake-results" aria-live="polite" aria-atomic="true">
        <div><dt>False alerts</dt><dd>{falseAlerts}</dd></div>
        <div><dt>Missed events</dt><dd>{missed}</dd></div>
        <div><dt>Detected events</dt><dd>{detected}</dd></div>
      </dl>
    </section>
  );
}

type Experiment = "house" | "quake";
type WorkbenchProps = {
  launchRequest?: { mode: Experiment; serial: number } | null;
};

export default function ModelWorkbench({ launchRequest }: WorkbenchProps) {
  const houseId = useId();
  const quakeId = useId();
  const [experiment, setExperiment] = useState<Experiment>("house");
  const [appliedVisit, setAppliedVisit] = useState<number | null>(null);

  if (launchRequest && launchRequest.serial !== appliedVisit) {
    setAppliedVisit(launchRequest.serial);
    setExperiment(launchRequest.mode);
  }

  return (
    <div className="model-workbench" id="model-workbench" tabIndex={-1} role="region" aria-label="Machine learning experiments">
      <div className="workbench-switch" role="group" aria-label="Choose a machine learning experiment">
        <button type="button" aria-pressed={experiment === "house"} aria-controls={houseId}
          onClick={() => setExperiment("house")}>Fit house prices</button>
        <button type="button" aria-pressed={experiment === "quake"} aria-controls={quakeId}
          onClick={() => setExperiment("quake")}>Classify quake records</button>
      </div>
      <div id={houseId} hidden={experiment !== "house"}><HouseFitExperiment /></div>
      <div id={quakeId} hidden={experiment !== "quake"}><QuakeThresholdExperiment /></div>
    </div>
  );
}
