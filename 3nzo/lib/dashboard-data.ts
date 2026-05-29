import { getDb } from "./db";

export interface DashboardKPIs {
  totalSpend: number;
  spendChange: number;
  impressions: number;
  impressionsChange: number;
  clicks: number;
  clicksChange: number;
  conversions: number;
  conversionsChange: number;
  avgCPC: number;
  avgCTR: number;
  searchIS: number;
  lostISBudget: number;
  lostISRank: number;
}

export interface BrandPerformance {
  brand: string;
  spend: number;
  clicks: number;
  convs: number;
  searchIS: number;
  trend: "up" | "down" | "flat";
}

function getDateRange(days: number = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days + 1);

  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevEndDate.getDate() - days + 1);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    prevStartDate: prevStartDate.toISOString().split("T")[0],
    prevEndDate: prevEndDate.toISOString().split("T")[0],
  };
}

export async function getDashboardKPIs(days: number = 7): Promise<DashboardKPIs> {
  const sql = getDb();
  const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange(days);

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

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  };

  return {
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
}

export async function getBrandPerformance(days: number = 7): Promise<BrandPerformance[]> {
  const sql = getDb();
  const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange(days);

  const currentData = await sql`
    SELECT
      b.brand_name,
      COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0, 2), 0) AS spend,
      COALESCE(SUM(f.clicks), 0) AS clicks,
      COALESCE(ROUND(SUM(f.conversions), 2), 0) AS conversions,
      COALESCE(ROUND(AVG(f.search_impression_share) * 100, 2), 0) AS search_is
    FROM fact_performance f
    JOIN dim_brands b ON f.brand_id = b.brand_id
    WHERE f.data_date BETWEEN ${startDate}::date AND ${endDate}::date
      AND b.is_mcc = FALSE
    GROUP BY b.brand_name
    ORDER BY spend DESC
  `;

  const prevData = await sql`
    SELECT
      b.brand_name,
      COALESCE(ROUND(SUM(f.cost_micros) / 1000000.0, 2), 0) AS spend
    FROM fact_performance f
    JOIN dim_brands b ON f.brand_id = b.brand_id
    WHERE f.data_date BETWEEN ${prevStartDate}::date AND ${prevEndDate}::date
      AND b.is_mcc = FALSE
    GROUP BY b.brand_name
  `;

  const prevSpendMap = new Map(prevData.map((p) => [p.brand_name, Number(p.spend)]));

  return currentData.map((row) => {
    const currentSpend = Number(row.spend);
    const prevSpend = prevSpendMap.get(row.brand_name) || 0;
    const trend: "up" | "down" | "flat" =
      currentSpend > prevSpend ? "up" :
      currentSpend < prevSpend ? "down" : "flat";

    return {
      brand: String(row.brand_name),
      spend: currentSpend,
      clicks: Number(row.clicks),
      convs: Number(row.conversions),
      searchIS: Number(row.search_is),
      trend,
    };
  });
}
