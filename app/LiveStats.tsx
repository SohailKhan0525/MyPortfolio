"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

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

  return (
    <section id="analytics" className="section-pad vs-section">
      <motion.div className="surface vs-card" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}>
        <div className="vs-head">
          <div>
            <p className="eyebrow"><span className="vs-dot" /> Live analytics</p>
            <h3>Who&rsquo;s actually visiting</h3>
          </div>
          <span className="vs-updated">{secs === null ? "connecting…" : secs < 5 ? "updated just now" : `updated ${secs}s ago`}</span>
        </div>

        {stats && !stats.configured ? (
          <p className="vs-note">Analytics isn&rsquo;t connected yet. Add the Upstash Redis integration in Vercel to switch this on.</p>
        ) : stats?.error ? (
          <p className="vs-note">Couldn&rsquo;t reach the analytics store just now. Retrying automatically.</p>
        ) : (
          <>
            <div className="vs-grid">
              <div className="vs-stat"><span>Today</span><strong>{stats ? fmt(stats.today) : "–"}</strong><small>page views</small></div>
              <div className="vs-stat"><span>This month</span><strong>{stats ? fmt(stats.month) : "–"}</strong><small>page views</small></div>
              <div className="vs-stat"><span>Unique visitors</span><strong>{stats ? fmt(stats.unique) : "–"}</strong><small>this month{stats ? ` · ${fmt(stats.uniqueToday)} today` : ""}</small></div>
            </div>
            <div className="vs-chart" role="img" aria-label="Page views per day for the last 30 days">
              <div className="vs-bars">
                {bars.map((d, i) => (
                  <i key={d.date} className={i === bars.length - 1 ? "is-today" : ""} title={`${d.date}: ${d.views} views`} style={{ height: `${Math.max(3, (d.views / max) * 100)}%`, animationDelay: `${i * 18}ms` }} />
                ))}
              </div>
              <div className="vs-axis"><span>30 days ago</span><span>daily page views</span><span>today</span></div>
            </div>
          </>
        )}
      </motion.div>
    </section>
  );
}
