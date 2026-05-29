import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const brandName = searchParams.get("brand");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!brandName || !startDate || !endDate) {
    return NextResponse.json(
      { error: "brand, startDate, and endDate are required" },
      { status: 400 }
    );
  }

  try {
    const sql = getDb();

    const campaigns = await sql`
      SELECT
        c.campaign_id,
        c.campaign_name,
        c.status,
        COALESCE(ROUND(c.daily_budget_micros / 1000000.0, 2), 0) AS daily_budget,
        COALESCE(SUM(f.impressions), 0) AS impressions,
        COALESCE(SUM(f.clicks), 0) AS clicks,
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0, 2), 0) AS spend,
        COALESCE(ROUND(SUM(f.conversions), 2), 0) AS conversions,
        COALESCE(ROUND(SUM(f.clicks) * 100.0 / NULLIF(SUM(f.impressions), 0), 2), 0) AS ctr,
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.clicks), 0), 2), 0) AS cpc,
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.conversions), 0), 2), 0) AS cpa,
        COALESCE(ROUND(SUM(f.conversions) * 100.0 / NULLIF(SUM(f.clicks), 0), 2), 0) AS cvr,
        COALESCE(ROUND(AVG(f.search_impression_share) * 100, 2), 0) AS search_is
      FROM dim_campaigns c
      JOIN dim_brands b ON c.brand_id = b.brand_id
      LEFT JOIN fact_performance f ON c.campaign_id = f.campaign_id
        AND f.data_date BETWEEN ${startDate}::date AND ${endDate}::date
      WHERE b.brand_name = ${brandName}
        AND b.is_mcc = FALSE
      GROUP BY c.campaign_id, c.campaign_name, c.status, c.daily_budget_micros
      ORDER BY spend DESC
    `;

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Campaigns API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}
