import { NextResponse } from "next/server";

const USERNAME = "SohailKhan0525";

type Contribution = { date: string; count: number; level: number };
type ContributionResponse = { total?: Record<string, number>; contributions?: Contribution[] };

export async function GET() {
  try {
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error(`Contribution service returned ${response.status}`);
    const data = (await response.json()) as ContributionResponse;
    const contributions = Array.isArray(data.contributions) ? data.contributions : [];
    const total = contributions.reduce((sum, day) => sum + Number(day.count || 0), 0);
    const activeDays = contributions.filter(day => Number(day.count || 0) > 0).length;

    let currentStreak = 0;
    let longestStreak = 0;
    let running = 0;
    for (const day of [...contributions].sort((a, b) => a.date.localeCompare(b.date))) {
      if (Number(day.count || 0) > 0) {
        running += 1;
        longestStreak = Math.max(longestStreak, running);
      } else {
        running = 0;
      }
    }

    const sorted = [...contributions].sort((a, b) => b.date.localeCompare(a.date));
    for (const day of sorted) {
      if (Number(day.count || 0) > 0) currentStreak += 1;
      else break;
    }

    return NextResponse.json({
      username: USERNAME,
      total,
      activeDays,
      currentStreak,
      longestStreak,
      updatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "GitHub contribution stats are temporarily unavailable." }, { status: 503 });
  }
}
