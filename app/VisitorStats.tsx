"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Eye, Users, TrendUp } from "@phosphor-icons/react";

type AnalyticsBucket = { timestamp?: string; pageviews?: number; visitors?: number; count?: number };
type Stats = {
  total: { pageviews: number; visitors: number };
  today: { pageviews: number; visitors: number };
  month: { pageviews: number; visitors: number };
  daily: AnalyticsBucket[];
  monthly: AnalyticsBucket[];
  unavailable?: boolean;
  generatedAt?: string;
};

const initial: Stats = {
  total: { pageviews: 0, visitors: 0 },
  today: { pageviews: 0, visitors: 0 },
  month: { pageviews: 0, visitors: 0 },
  daily: [],
  monthly: [],
};

const format = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

function totalRows(rows: AnalyticsBucket[], key: "pageviews" | "visitors" | "count") {
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0);
}

export default function VisitorStats() {
  const [stats, setStats] = useState<Stats>(initial);
  const [live, setLive] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/visitor-stats", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: Stats) => alive && setStats(data))
      .catch(() => undefined);
    load();
    const timer = window.setInterval(load, 60_000);
    const onPresence = () => setLive((value) => Math.max(value, 1));
    window.addEventListener("visibilitychange", onPresence);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("visibilitychange", onPresence);
    };
  }, []);

  useEffect(() => {
    setLive(1);
    const hide = () => setLive(0);
    const show = () => setLive(1);
    document.addEventListener("visibilitychange", () => {});
    const interval = window.setInterval(() => setLive(document.visibilityState === "visible" ? 1 : 0), 5000);
    window.addEventListener("focus", show);
    window.addEventListener("blur", hide);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", show);
      window.removeEventListener("blur", hide);
    };
  }, []);

  const dayViews = stats.daily.length ? totalRows(stats.daily, "pageviews") : stats.month.pageviews;
  const returning = Math.max(0, stats.month.visitors > 0 ? stats.month.pageviews - stats.month.visitors : 0);
  const repeatRate = stats.month.pageviews > 0 ? Math.round((returning / stats.month.pageviews) * 100) : 0;
  const monthLabel = useMemo(() => new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date()), []);

  return (
    <section className="section-pad section-block visitor-section" aria-labelledby="visitor-title">
      <div className="visitor-panel surface">
        <div className="visitor-header">
          <div>
            <p className="eyebrow">Live site pulse</p>
            <h2 id="visitor-title">People are actually here.</h2>
            <p>Anonymous traffic totals from Vercel Web Analytics, refreshed every minute.</p>
          </div>
          <div className="visitor-live"><span className="visitor-pulse" /> {live ? "Live now" : "Away"}</div>
        </div>

        <div className="visitor-grid">
          <article className="visitor-stat visitor-stat-live"><span className="visitor-icon"><Activity size={19} weight="bold" /></span><strong>{live}</strong><span>Visitors live</span><small>this browser session</small></article>
          <article className="visitor-stat"><span className="visitor-icon"><Users size={19} weight="bold" /></span><strong>{format.format(stats.today.visitors)}</strong><span>Unique today</span><small>{format.format(stats.today.pageviews)} page views</small></article>
          <article className="visitor-stat"><span className="visitor-icon"><Eye size={19} weight="bold" /></span><strong>{format.format(stats.month.pageviews)}</strong><span>Views · {monthLabel}</span><small>{format.format(stats.month.visitors)} unique visitors</small></article>
          <article className="visitor-stat"><span className="visitor-icon"><TrendUp size={19} weight="bold" /></span><strong>{repeatRate}%</strong><span>Repeat-view signal</span><small>{format.format(dayViews)} recent page views</small></article>
        </div>

        <div className="visitor-footer"><span><i /> Total lifetime: {format.format(stats.total.visitors)} visitors · {format.format(stats.total.pageviews)} views</span><span>{stats.unavailable ? "Analytics pending setup" : "Updated automatically"}</span></div>
      </div>
    </section>
  );
}
