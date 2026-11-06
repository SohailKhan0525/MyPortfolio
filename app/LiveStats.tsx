"use client";

import { gsap, useGSAP } from "./gsap";
import { AnimatedMetric, Reveal } from "./MotionElements";
import { usePortfolioMotion } from "./MotionPreferences";
import { useCallback, useEffect, useRef, useState } from "react";

type Stats = {
  configured: boolean;
  error?: boolean;
  days?: { date: string; views: number }[];
  today?: number;
  month?: number;
  unique?: number;
  uniqueToday?: number;
};

const fmt = (n = 0) => n.toLocaleString("en-IN");

export default function LiveStats() {
  const { ready, reduced } = usePortfolioMotion();
  const chart = useRef<HTMLDivElement>(null);
  const chartEntered = useRef(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics", { cache: "no-store" });
      setStats((await res.json()) as Stats);
      setUpdated(new Date());
    } catch {}
  }, []);

  // Count every page load (a 15s throttle ignores rapid refreshes). Visit once with ?notrack to exclude your own browser; ?track to undo.
  useEffect(() => {
    let counted = false;
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.has("notrack")) localStorage.setItem("portfolio-notrack", "1");
      if (q.has("track")) localStorage.removeItem("portfolio-notrack");
      const last = Number(sessionStorage.getItem("portfolio-counted-at") ?? 0);
      if (!localStorage.getItem("portfolio-notrack") && Date.now() - last > 15000) {
        let vid = localStorage.getItem("portfolio-vid");
        if (!vid) { vid = crypto.randomUUID(); localStorage.setItem("portfolio-vid", vid); }
        counted = true;
        fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vid }), keepalive: true })
          .then(r => { if (r.ok) sessionStorage.setItem("portfolio-counted-at", String(Date.now())); })
          .catch(() => {})
          .finally(load);
      }
    } catch {}
    if (!counted) load();
  }, [load]);

  // Live refresh every 8s while the tab is visible.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
      tick(n => n + 1);
    }, 8000);
    return () => window.clearInterval(id);
  }, [load]);

  const days = stats?.days ?? [];
  const max = Math.max(1, ...days.map(d => d.views));
  const secs = updated ? Math.max(0, Math.round((Date.now() - updated.getTime()) / 1000)) : null;
  const bars = days.length ? days : Array.from({ length: 30 }, (_, i) => ({ date: String(i), views: 0 }));

  useGSAP(() => {
    if (!chart.current || !ready || reduced || !stats?.configured || stats.error || chartEntered.current) return;
    gsap.fromTo(chart.current.querySelectorAll(".vs-bars i"),
      { scaleY: 0.05, transformOrigin: "center bottom" },
      {
        scaleY: 1, duration: 0.7, stagger: 0.018, ease: "power3.out",
        scrollTrigger: {
          trigger: chart.current, start: "top 92%", once: true,
          onEnter: () => { chartEntered.current = true; },
        },
      });
  }, { scope: chart, dependencies: [ready, reduced, stats?.configured, stats?.error, days.length], revertOnUpdate: true });

  return (
    <section id="analytics" className="section-pad vs-section">
      <Reveal className="surface vs-card" sequence>
        <div className="vs-head">
          <div>
            <h3>Site visits</h3>
          </div>
          <span className="vs-updated">{secs === null ? "connecting…" : secs < 5 ? "updated just now" : `updated ${secs}s ago`}</span>
        </div>

        {stats && !stats.configured ? (
          <p className="vs-note">Visit statistics are not available yet.</p>
        ) : stats?.error ? (
          <p className="vs-note">Couldn&rsquo;t reach the analytics store just now. Retrying automatically.</p>
        ) : (
          <>
            <div className="vs-grid">
              <div className="vs-stat"><span>Today</span><strong>{stats ? <AnimatedMetric value={stats.today ?? 0} /> : "–"}</strong><small>page views</small></div>
              <div className="vs-stat"><span>This month</span><strong>{stats ? <AnimatedMetric value={stats.month ?? 0} /> : "–"}</strong><small>page views</small></div>
              <div className="vs-stat"><span>Unique visitors</span><strong>{stats ? <AnimatedMetric value={stats.unique ?? 0} /> : "–"}</strong><small>this month{stats ? ` · ${fmt(stats.uniqueToday)} today` : ""}</small></div>
            </div>
            <div ref={chart} className="vs-chart" role="img" aria-label="Page views per day for the last 30 days">
              <div className="vs-bars">
                {bars.map((d, i) => (
                  <i key={d.date} className={i === bars.length - 1 ? "is-today" : ""} title={`${d.date}: ${d.views} views`} style={{ height: `${Math.max(3, (d.views / max) * 100)}%` }} />
                ))}
              </div>
              <div className="vs-axis"><span>30 days ago</span><span>daily page views</span><span>today</span></div>
            </div>
          </>
        )}
      </Reveal>
    </section>
  );
}
