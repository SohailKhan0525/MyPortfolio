import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CountResponse = { data?: { pageviews?: number; visitors?: number } };
type AggregateResponse = { data?: unknown[] };
const API_BASE = "https://api.vercel.com/v1/query/web-analytics";

function dateOnly(daysAgo = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function queryAnalytics(path: string, params: Record<string, string>) {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID;
  if (!token || !projectId || !teamId) return null;

  const url = new URL(`${API_BASE}/${path}`);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("teamId", teamId);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Analytics API returned ${response.status}`);
  return response.json() as Promise<CountResponse | AggregateResponse>;
}

async function count(since?: string, until?: string) {
  const params: Record<string, string> = {};
  if (since) params.since = since;
  if (until) params.until = until;
  return queryAnalytics("visits/count", params) as Promise<CountResponse | null>;
}

async function aggregate(since: string, until: string, by: string) {
  return queryAnalytics("visits/aggregate", { since, until, by, limit: "100" }) as Promise<AggregateResponse | null>;
}

export async function GET() {
  try {
    const [total, today, month, daily, monthly] = await Promise.all([
      count(),
      count(dateOnly(0), dateOnly(0)),
      count(dateOnly(29), dateOnly(0)),
      aggregate(dateOnly(29), dateOnly(0), "day"),
      aggregate(dateOnly(364), dateOnly(0), "month"),
    ]);

    return NextResponse.json({
      total: { pageviews: total?.data?.pageviews ?? 0, visitors: total?.data?.visitors ?? 0 },
      today: { pageviews: today?.data?.pageviews ?? 0, visitors: today?.data?.visitors ?? 0 },
      month: { pageviews: month?.data?.pageviews ?? 0, visitors: month?.data?.visitors ?? 0 },
      daily: Array.isArray(daily?.data) ? daily.data : [],
      monthly: Array.isArray(monthly?.data) ? monthly.data : [],
      generatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      total: { pageviews: 0, visitors: 0 }, today: { pageviews: 0, visitors: 0 }, month: { pageviews: 0, visitors: 0 },
      daily: [], monthly: [], unavailable: true, generatedAt: new Date().toISOString(),
    }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
