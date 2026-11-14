"use client";

import { useId, useState } from "react";
import "./house-fit.css";

// Invented examples for the field lab. Prices are in lakh rupees; sizes are in ft².
const fittingHomes = [
  { area: 550, price: 30 }, { area: 750, price: 35 }, { area: 950, price: 50 },
  { area: 1150, price: 53 }, { area: 1350, price: 70 }, { area: 1550, price: 79 },
];
const unseenHomes = [{ area: 650, price: 39 }, { area: 1050, price: 49 }, { area: 1450, price: 83 }];
const x = (area: number) => 40 + ((area - 400) / 1200) * 276;
const y = (lakhs: number) => 152 - (lakhs / 120) * 128;

export default function HouseFitExperiment() {
  const rateId = useId();
  const titleId = useId();
  const [rate, setRate] = useState(3000);
  const [evaluating, setEvaluating] = useState(false);
  const homes = evaluating ? unseenHomes : fittingHomes;
  const predict = (area: number) => (rate * area) / 100000;
  const meanError = homes.reduce((sum, home) => sum + Math.abs(predict(home.area) - home.price), 0) / homes.length;

  return (
    <section className="house-fit" aria-labelledby={titleId}>
      <h3 id={titleId}>Can you fit the house prices?</h3>
      <p className="house-fit-instructions">These are made-up sales. Adjust the price per square foot to bring the line closer to the dots.</p>
      <svg className="house-fit-plot" viewBox="0 0 342 178" role="img" aria-label={`Price versus floor area for ${homes.length} ${evaluating ? "unseen" : "practice"} homes. The line uses ${rate} rupees per square foot. Mean absolute error is ${meanError.toFixed(1)} lakh rupees.`}>
        <text x="4" y="12">Price (₹ lakh)</text>
        {[0, 40, 80, 120].map(value => <g key={value}>
          <line x1="40" x2="316" y1={y(value)} y2={y(value)} className="house-fit-grid" />
          <text x="32" y={y(value) + 3} textAnchor="end">{value}</text>
        </g>)}
        {[400, 1000, 1600].map(area => <text key={area} x={x(area)} y="170" textAnchor={area === 400 ? "start" : area === 1600 ? "end" : "middle"}>{area.toLocaleString("en-IN")} ft²</text>)}
        <line x1={x(400)} x2={x(1600)} y1={y(predict(400))} y2={y(predict(1600))} className="house-fit-line" />
        {homes.map(home => <g key={home.area}>
          <line x1={x(home.area)} x2={x(home.area)} y1={y(predict(home.area))} y2={y(home.price)} className="house-fit-gap" />
          <circle cx={x(home.area)} cy={y(home.price)} r="4.5" className="house-fit-sale" />
        </g>)}
      </svg>
      <div className="house-fit-rate"><label htmlFor={rateId}>Price per square foot</label><span>₹{rate.toLocaleString("en-IN")}</span></div>
      <input id={rateId} type="range" min={2000} max={7500} step={100} value={rate} disabled={evaluating}
        aria-valuetext={`${rate} rupees per square foot`} onChange={event => setRate(event.currentTarget.valueAsNumber)} />
      <div className="house-fit-result">
        <p aria-live="polite" aria-atomic="true"><span>Mean absolute error</span><strong>₹{meanError.toFixed(1)} lakh</strong><small>across {homes.length} {evaluating ? "unseen" : "practice"} homes</small></p>
        <button type="button" onClick={() => setEvaluating(current => !current)}>{evaluating ? "Back to fitting" : "Check unseen homes"}<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={evaluating ? "M20 12H4m7-7-7 7 7 7" : "M4 12h16m-7-7 7 7-7 7"} /></svg></button>
      </div>
    </section>
  );
}
