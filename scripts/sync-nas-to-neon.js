'use strict';
/**
 * NAS → Neon Star Schema Sync Script
 *
 * Reads google_ads_metrics from NAS (slack_channel_matrix DB) and
 * transforms the flat rows into the 3nzo star schema in Neon:
 *   dim_campaigns, dim_ad_groups, fact_performance
 *
 * Run on Synology via Task Scheduler (daily, after ingest.js completes).
 *
 * Environment Variables (loaded from .env by ingest.js pattern):
 *   DB_URL      - Local NAS PostgreSQL connection string (same var as ingest.js)
 *   NEON_DB_URL - Neon serverless PostgreSQL connection string
 */

const { Pool } = require('pg');

// Configuration — DB_URL matches the variable name used in ingest.js
const NAS_DB_URL = process.env.DB_URL;
const NEON_DB_URL = process.env.NEON_DB_URL;

if (!NAS_DB_URL) {
        console.error('[sync] ERROR: DB_URL environment variable is required (NAS PostgreSQL)');
        process.exit(1);
}

if (!NEON_DB_URL) {
        console.error('[sync] ERROR: NEON_DB_URL environment variable is required');
        process.exit(1);
}

// Connection pools
const nasPool = new Pool({ connectionString: NAS_DB_URL });
const neonPool = new Pool({
        connectionString: NEON_DB_URL,
        ssl: { rejectUnauthorized: false }
});

/**
 * Get the most recent report_date already in fact_performance
 */
async function getLastSyncDate() {
        try {
                  const result = await neonPool.query(
                              'SELECT MAX(report_date) AS last_date FROM fact_performance'
                            );
                  return result.rows[0]?.last_date || null;
        } catch (error) {
                  console.log('[sync] No existing fact_performance data — doing full sync');
                  return null;
        }
}

/**
 * Fetch rows from NAS google_ads_metrics table.
 */
async function fetchRowsFromNAS(lastDate) {
        let query, params;
        if (lastDate) {
                  query = `
                        SELECT brand, customer_id, report_date,
                                     campaign_id, campaign_name,
                                                  ad_group_id, ad_group_name,
                                                               impressions, clicks, cost_micros,
                                                                            conversions, conv_value
                                                                                  FROM google_ads_metrics
                                                                                        WHERE report_date > $1
                                                                                              ORDER BY report_date ASC
                                                                                                  `;
                  params = [lastDate];
        } else {
                  query = `
                        SELECT brand, customer_id, report_date,
                                     campaign_id, campaign_name,
                                                  ad_group_id, ad_group_name,
                                                               impressions, clicks, cost_micros,
                                                                            conversions, conv_value
                                                                                  FROM google_ads_metrics
                                                                                        ORDER BY report_date ASC
                                                                                            `;
                  params = [];
        }
        const result = await nasPool.query(query, params);
        return result.rows;
}

/**
 * Look up brand_id from dim_brands by matching on customer_id or brand name.
 */
async function resolveBrandId(client, brandName, customerId) {
        if (customerId) {
                  const r = await client.query(
                              'SELECT brand_id FROM dim_brands WHERE customer_id = $1 LIMIT 1',
                              [String(customerId)]
                            );
                  if (r.rows.length > 0) return r.rows[0].brand_id;
        }
        if (brandName) {
                  const r = await client.query(
                              "SELECT brand_id FROM dim_brands WHERE LOWER(brand_name) LIKE LOWER('%' || $1 || '%') LIMIT 1",
                              [brandName]
                            );
                  if (r.rows.length > 0) return r.rows[0].brand_id;
        }
        return null;
}

/**
 * Upsert a campaign into dim_campaigns.
 */
async function upsertCampaign(client, campaignId, brandId, campaignName) {
        await client.query(`
            INSERT INTO dim_campaigns (campaign_id, brand_id, campaign_name, status, updated_at)
                VALUES ($1, $2, $3, 'ACTIVE', NOW())
                    ON CONFLICT (campaign_id) DO UPDATE SET
                          brand_id      = EXCLUDED.brand_id,
                                campaign_name = EXCLUDED.campaign_name,
                                      updated_at    = NOW()
                                        `, [String(campaignId), brandId, campaignName]);
        return String(campaignId);
}

/**
 * Upsert an ad group into dim_ad_groups.
 */
async function upsertAdGroup(client, adGroupId, campaignId, adGroupName) {
        await client.query(`
            INSERT INTO dim_ad_groups (ad_group_id, campaign_id, ad_group_name, status, updated_at)
                VALUES ($1, $2, $3, 'ACTIVE', NOW())
                    ON CONFLICT (ad_group_id) DO UPDATE SET
                          campaign_id    = EXCLUDED.campaign_id,
                                ad_group_name  = EXCLUDED.ad_group_name,
                                      updated_at     = NOW()
                                        `, [String(adGroupId), String(campaignId), adGroupName]);
        return String(adGroupId);
}

/**
 * Upsert a fact_performance row.
 */
async function upsertFact(client, row, brandId, campaignId, adGroupId) {
        const spend = row.cost_micros ? (Number(row.cost_micros) / 1000000) : 0;
        await client.query(`
            INSERT INTO fact_performance (
                  brand_id, campaign_id, ad_group_id, report_date,
                        impressions, clicks, spend, conversions, conv_value,
                              updated_at
                                  )
                                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                                          ON CONFLICT (brand_id, campaign_id, ad_group_id, report_date) DO UPDATE SET
                                                impressions = EXCLUDED.impressions,
                                                      clicks      = EXCLUDED.clicks,
                                                            spend       = EXCLUDED.spend,
                                                                  conversions = EXCLUDED.conversions,
                                                                        conv_value  = EXCLUDED.conv_value,
                                                                              updated_at  = NOW()
                                                                                `, [
                  brandId,
                  String(campaignId),
                  String(adGroupId),
                  row.report_date,
                  Number(row.impressions) || 0,
                  Number(row.clicks) || 0,
                  spend,
                  Number(row.conversions) || 0,
                  Number(row.conv_value) || 0,
                ]);
}

/**
 * Main sync function
 */
async function syncNASToNeon() {
        console.log('[sync] Starting NAS -> Neon star schema sync...');
        const startTime = Date.now();

  try {
            const lastDate = await getLastSyncDate();
            if (lastDate) {
                        console.log('[sync] Incremental sync: fetching rows after ' + lastDate);
            } else {
                        console.log('[sync] Full sync: fetching all rows');
            }

          const rows = await fetchRowsFromNAS(lastDate);
            console.log('[sync] Fetched ' + rows.length + ' rows from NAS');

          if (rows.length === 0) {
                      console.log('[sync] Nothing to sync. Already up to date.');
                      return 0;
          }

          const client = await neonPool.connect();
            let syncedCount = 0;
            let skippedCount = 0;

          try {
                      await client.query('BEGIN');

              for (const row of rows) {
                            const brandId = await resolveBrandId(client, row.brand, row.customer_id);
                            if (!brandId) {
                                            console.warn('[sync] SKIP: brand not found for brand="' + row.brand + '", customer_id="' + row.customer_id + '"');
                                            skippedCount++;
                                            continue;
                            }

                        const campaignId = await upsertCampaign(client, row.campaign_id, brandId, row.campaign_name);
                            const adGroupId = await upsertAdGroup(client, row.ad_group_id, campaignId, row.ad_group_name);
                            await upsertFact(client, row, brandId, campaignId, adGroupId);
                            syncedCount++;
              }

              await client.query('COMMIT');
                      console.log('[sync] Committed ' + syncedCount + ' rows to Neon star schema (skipped ' + skippedCount + ')');

          } catch (error) {
                      await client.query('ROLLBACK');
                      console.error('[sync] ERROR during upsert, rolled back:', error.message);
                      throw error;
          } finally {
                      client.release();
          }

          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log('[sync] Done in ' + elapsed + 's');
            return syncedCount;

  } finally {
            await nasPool.end();
            await neonPool.end();
  }
}

// Run
syncNASToNeon()
  .then(function(count) {
            console.log('[sync] Sync complete -- ' + count + ' fact rows upserted');
            process.exit(0);
  })
  .catch(function(err) {
            console.error('[sync] Fatal error:', err);
            process.exit(1);
  });
