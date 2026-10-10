import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Cmd = (string | number)[];
type Reply = { result?: unknown; error?: string };

function cfg() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(cmds: Cmd[]): Promise<Reply[]> {
  const c = cfg();
  if (!c) throw new Error("not configured");
  const res = await fetch(`${c.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return (await res.json()) as Reply[];
}

// Days are counted in India time (IST, UTC+5:30).
const istDay = (daysAgo = 0) => new Date(Date.now() + 19_800_000 - daysAgo * 86_400_000).toISOString().slice(0, 10);

export async function GET() {
  if (!cfg()) return NextResponse.json({ configured: false });
  try {
    const dates = Array.from({ length: 30 }, (_, i) => istDay(29 - i));
    const today = dates[29];
    const month = today.slice(0, 7);
    const [mget, monthViews, monthUnique, todayUnique] = await redis([
      ["MGET", ...dates.map(d => `pv:d:${d}`)],
      ["GET", `pv:m:${month}`],
      ["PFCOUNT", `uv:m:${month}`],
      ["PFCOUNT", `uv:d:${today}`],
    ]);
    const raw = (mget.result as (string | null)[]) ?? [];
    const days = dates.map((date, i) => ({ date, views: Number(raw[i] ?? 0) }));
    return NextResponse.json({
      configured: true,
      days,
      today: days[29].views,
      month: Number(monthViews.result ?? 0),
      unique: Number(monthUnique.result ?? 0),
      uniqueToday: Number(todayUnique.result ?? 0),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ configured: true, error: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!cfg()) return NextResponse.json({ ok: false }, { status: 202 });
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || /bot|crawl|spider|slurp|headless|lighthouse|vercel|preview|monitor/i.test(ua)) return NextResponse.json({ ok: true, skipped: true });
  let vid = "";
  try { vid = String((await request.json())?.vid ?? ""); } catch {}
  if (!/^[a-z0-9-]{8,64}$/i.test(vid)) return NextResponse.json({ ok: false }, { status: 400 });
  const day = istDay();
  const month = day.slice(0, 7);
  try {
    await redis([
      ["INCR", `pv:d:${day}`],
      ["INCR", `pv:m:${month}`],
      ["PFADD", `uv:d:${day}`, vid],
      ["PFADD", `uv:m:${month}`, vid],
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
