import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  try {
    const sql = getDb();

    // Calculate previous period for comparison
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - daysDiff + 1);

    const prevStartDate = prevStart.toISOString().split("T")[0];
    const prevEndDate = prevEnd.toISOString().split("T")[0];

    // Current period KPIs
    const [currentPeriod] = await sql`
      SELECT
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0, 2), 0) AS total_spend,
        COALESCE(SUM(f.impressions), 0) AS impressions,
        COALESCE(SUM(f.clicks), 0) AS clicks,
        COALESCE(ROUND(SUM(f.conversions), 2), 0) AS conversions,
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.clicks), 0), 2), 0) AS avg_cpc,
        COALESCE(ROUND(SUM(f.clicks) * 100.0 / NULLIF(SUM(f.impressions), 0), 2), 0) AS avg_ctr,
        COALESCE(ROUND(AVG(f.search_impression_share) * 100, 2), 0) AS search_is,
        COALESCE(ROUND(AVG(f.search_lost_is_budget) * 100, 2), 0) AS lost_is_budget,
        COALESCE(ROUND(AVG(f.search_lost_is_rank) * 100, 2), 0) AS lost_is_rank
      FROM fact_performance f
      JOIN dim_brands b ON f.brand_id = b.brand_id
      WHERE f.data_date BETWEEN ${startDate}::date AND ${endDate}::date
        AND b.is_mcc = FALSE
    `;

    // Previous period KPIs for comparison
    const [prevPeriod] = await sql`
      SELECT
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0, 2), 0) AS total_spend,
        COALESCE(SUM(f.impressions), 0) AS impressions,
        COALESCE(SUM(f.clicks), 0) AS clicks,
        COALESCE(ROUND(SUM(f.conversions), 2), 0) AS conversions
      FROM fact_performance f
      JOIN dim_brands b ON f.brand_id = b.brand_id
      WHERE f.data_date BETWEEN ${prevStartDate}::date AND ${prevEndDate}::date
        AND b.is_mcc = FALSE
    `;

    // Brand performance with all metrics
    const currentBrands = await sql`
      SELECT
        b.brand_name,
        COALESCE(SUM(f.impressions), 0) AS impressions,
        COALESCE(SUM(f.clicks), 0) AS clicks,
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0, 2), 0) AS spend,
        COALESCE(ROUND(SUM(f.conversions), 2), 0) AS conversions,
        COALESCE(ROUND(SUM(f.clicks) * 100.0 / NULLIF(SUM(f.impressions), 0), 2), 0) AS ctr,
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.clicks), 0), 2), 0) AS cpc,
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.conversions), 0), 2), 0) AS cpa,
        COALESCE(ROUND(SUM(f.conversions) * 100.0 / NULLIF(SUM(f.clicks), 0), 2), 0) AS cvr,
        COALESCE(ROUND(AVG(f.search_impression_share) * 100, 2), 0) AS search_is,
        COALESCE(ROUND(AVG(f.search_lost_is_budget) * 100, 2), 0) AS lost_is_budget,
        COALESCE(ROUND(AVG(f.search_lost_is_rank) * 100, 2), 0) AS lost_is_rank,
        COUNT(DISTINCT f.campaign_id) AS campaign_count
      FROM fact_performance f
      JOIN dim_brands b ON f.brand_id = b.brand_id
      WHERE f.data_date BETWEEN ${startDate}::date AND ${endDate}::date
        AND b.is_mcc = FALSE
      GROUP BY b.brand_name
      ORDER BY spend DESC
    `;

    // Get campaign details per brand
    const campaignDetails = await sql`
      SELECT
        b.brand_name,
        COUNT(*) FILTER (WHERE c.status = 'ENABLED') AS active_campaigns,
        COUNT(*) FILTER (WHERE c.status = 'PAUSED') AS paused_campaigns,
        COALESCE(ROUND(SUM(c.daily_budget_micros) / 1000000.0, 2), 0) AS total_daily_budget
      FROM dim_campaigns c
      JOIN dim_brands b ON c.brand_id = b.brand_id
      WHERE b.is_mcc = FALSE
      GROUP BY b.brand_name
    `;

    const campaignMap = new Map(campaignDetails.map((c) => [c.brand_name, c]));

    // Brand performance for previous period
    const prevBrands = await sql`
      SELECT
        b.brand_name,
        COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0, 2), 0) AS spend
      FROM fact_performance f
      JOIN dim_brands b ON f.brand_id = b.brand_id
      WHERE f.data_date BETWEEN ${prevStartDate}::date AND ${prevEndDate}::date
        AND b.is_mcc = FALSE
      GROUP BY b.brand_name
    `;

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    const prevSpendMap = new Map(prevBrands.map((p) => [p.brand_name, Number(p.spend)]));

    const kpis = {
      totalSpend: Number(currentPeriod.total_spend) || 0,
      spendChange: calcChange(Number(currentPeriod.total_spend), Number(prevPeriod.total_spend)),
      impressions: Number(currentPeriod.impressions) || 0,
      impressionsChange: calcChange(Number(currentPeriod.impressions), Number(prevPeriod.impressions)),
      clicks: Number(currentPeriod.clicks) || 0,
      clicksChange: calcChange(Number(currentPeriod.clicks), Number(prevPeriod.clicks)),
      conversions: Number(currentPeriod.conversions) || 0,
      conversionsChange: calcChange(Number(currentPeriod.conversions), Number(prevPeriod.conversions)),
      avgCPC: Number(currentPeriod.avg_cpc) || 0,
      avgCTR: Number(currentPeriod.avg_ctr) || 0,
      searchIS: Number(currentPeriod.search_is) || 0,
      lostISBudget: Number(currentPeriod.lost_is_budget) || 0,
      lostISRank: Number(currentPeriod.lost_is_rank) || 0,
    };

    const brands = currentBrands.map((row) => {
      const currentSpend = Number(row.spend);
      const prevSpend = prevSpendMap.get(row.brand_name) || 0;
      const trend = currentSpend > prevSpend ? "up" : currentSpend < prevSpend ? "down" : "flat";
      const campaignInfo = campaignMap.get(row.brand_name);

      return {
        brand: String(row.brand_name),
        impressions: Number(row.impressions),
        clicks: Number(row.clicks),
        spend: currentSpend,
        conversions: Number(row.conversions),
        ctr: Number(row.ctr),
        cpc: Number(row.cpc),
        cpa: Number(row.cpa),
        cvr: Number(row.cvr),
        searchIS: Number(row.search_is),
        lostISBudget: Number(row.lost_is_budget),
        lostISRank: Number(row.lost_is_rank),
        activeCampaigns: Number(campaignInfo?.active_campaigns || 0),
        pausedCampaigns: Number(campaignInfo?.paused_campaigns || 0),
        totalDailyBudget: Number(campaignInfo?.total_daily_budget || 0),
        trend,
      };
    });

    return NextResponse.json({ kpis, brands });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
