import { neon } from "@neondatabase/serverless";

export function getDb() {
  const sql = neon(process.env.NEON_DATABASE_URL!);
  return sql;
}

// Typed query helpers
export async function querySpendSummary(
  startDate: string,
  endDate: string,
  brandName?: string
) {
  const sql = getDb();

  const result = await sql`
    SELECT
      b.brand_name,
      ROUND(SUM(f.cost_micros) / 1000000.0, 2) AS spend,
      SUM(f.impressions) AS impressions,
      SUM(f.clicks) AS clicks,
      ROUND(SUM(f.conversions), 2) AS conversions,
      ROUND(SUM(f.clicks) * 100.0 / NULLIF(SUM(f.impressions), 0), 2) AS ctr,
      ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.clicks), 0), 2) AS cpc,
      ROUND(SUM(f.conversions) / NULLIF(SUM(f.clicks), 0) * 100, 2) AS conv_rate,
      ROUND(AVG(f.search_impression_share) * 100, 2) AS search_is_pct,
      ROUND(AVG(f.search_lost_is_budget) * 100, 2) AS lost_is_budget_pct,
      ROUND(AVG(f.search_lost_is_rank) * 100, 2) AS lost_is_rank_pct
    FROM fact_performance f
    JOIN dim_brands b ON f.brand_id = b.brand_id
    WHERE f.data_date BETWEEN ${startDate}::date AND ${endDate}::date
      AND b.is_mcc = FALSE
      ${brandName ? sql`AND b.brand_name ILIKE ${'%' + brandName + '%'}` : sql``}
    GROUP BY b.brand_name
    ORDER BY spend DESC
  `;

  return result;
}

export async function queryCampaigns(brandName?: string) {
  const sql = getDb();

  const result = await sql`
    SELECT
      c.campaign_id,
      c.remote_campaign_id,
      b.brand_name,
      c.campaign_name,
      c.status,
      ROUND(c.daily_budget_micros / 1000000.0, 2) AS daily_budget,
      c.updated_at
    FROM dim_campaigns c
    JOIN dim_brands b ON c.brand_id = b.brand_id
    WHERE b.is_mcc = FALSE
      ${brandName ? sql`AND b.brand_name ILIKE ${'%' + brandName + '%'}` : sql``}
    ORDER BY b.brand_name, c.campaign_name
  `;

  return result;
}

export async function queryAdGroups(campaignId?: number) {
  const sql = getDb();

  const result = await sql`
    SELECT
      ag.ad_group_id,
      ag.remote_ad_group_id,
      c.campaign_name,
      b.brand_name,
      ag.ad_group_name,
      ag.status,
      ROUND(ag.cpc_bid_micros / 1000000.0, 2) AS cpc_bid,
      ag.updated_at
    FROM dim_ad_groups ag
    JOIN dim_campaigns c ON ag.campaign_id = c.campaign_id
    JOIN dim_brands b ON c.brand_id = b.brand_id
    WHERE b.is_mcc = FALSE
      ${campaignId ? sql`AND ag.campaign_id = ${campaignId}` : sql``}
    ORDER BY b.brand_name, c.campaign_name, ag.ad_group_name
  `;

  return result;
}

export async function queryPerformanceTrend(
  startDate: string,
  endDate: string,
  brandName?: string,
  groupBy: "day" | "campaign" | "ad_group" = "day"
) {
  const sql = getDb();

  if (groupBy === "day") {
    return await sql`
      SELECT
        f.data_date,
        SUM(f.impressions) AS impressions,
        SUM(f.clicks) AS clicks,
        ROUND(SUM(f.cost_micros) / 1000000.0, 2) AS spend,
        ROUND(SUM(f.conversions), 2) AS conversions,
        ROUND(AVG(f.search_impression_share) * 100, 2) AS search_is_pct
      FROM fact_performance f
      JOIN dim_brands b ON f.brand_id = b.brand_id
      WHERE f.data_date BETWEEN ${startDate}::date AND ${endDate}::date
        AND b.is_mcc = FALSE
        ${brandName ? sql`AND b.brand_name ILIKE ${'%' + brandName + '%'}` : sql``}
      GROUP BY f.data_date
      ORDER BY f.data_date
    `;
  }

  // Campaign grouping
  return await sql`
    SELECT
      c.campaign_name,
      SUM(f.impressions) AS impressions,
      SUM(f.clicks) AS clicks,
      ROUND(SUM(f.cost_micros) / 1000000.0, 2) AS spend,
      ROUND(SUM(f.conversions), 2) AS conversions
    FROM fact_performance f
    JOIN dim_brands b ON f.brand_id = b.brand_id
    JOIN dim_campaigns c ON f.campaign_id = c.campaign_id
    WHERE f.data_date BETWEEN ${startDate}::date AND ${endDate}::date
      AND b.is_mcc = FALSE
      ${brandName ? sql`AND b.brand_name ILIKE ${'%' + brandName + '%'}` : sql``}
    GROUP BY c.campaign_name
    ORDER BY spend DESC
  `;
}

export async function logMutation(
  entityType: "campaign" | "ad_group",
  entityId: number,
  remoteEntityId: string,
  customerId: string,
  action: string,
  fieldChanged: string,
  oldValue: string,
  newValue: string,
  userMessage?: string
) {
  const sql = getDb();

  const result = await sql`
    INSERT INTO enzo_mutations (
      entity_type, entity_id, remote_entity_id, customer_id,
      action, field_changed, old_value, new_value,
      triggered_by, user_message
    ) VALUES (
      ${entityType}, ${entityId}, ${remoteEntityId}, ${customerId},
      ${action}, ${fieldChanged}, ${oldValue}, ${newValue},
      '3nzo', ${userMessage || null}
    )
    RETURNING mutation_id
  `;

  return result[0];
}

export async function updateMutationStatus(
  mutationId: number,
  status: "success" | "failed",
  errorMessage?: string
) {
  const sql = getDb();

  await sql`
    UPDATE enzo_mutations
    SET execution_status = ${status},
        executed_at = NOW(),
        error_message = ${errorMessage || null}
    WHERE mutation_id = ${mutationId}
  `;
}
