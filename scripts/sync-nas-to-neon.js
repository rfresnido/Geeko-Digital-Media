'use strict';
/**
 * NAS -> Neon Star Schema Sync Script
 *
 * Reads google_ads_metrics from NAS (slack_channel_matrix DB) and
 * transforms flat rows into the 3nzo star schema in Neon:
 *   dim_campaigns, dim_ad_groups, fact_performance
 *
 * Run on Synology via Task Scheduler (daily, after ingest.js completes).
 *
 * Environment Variables (from .env, same as ingest.js):
 *   DB_URL      - Local NAS PostgreSQL connection string
 *   NEON_DB_URL - Neon serverless PostgreSQL connection string
 */

const { Pool } = require('pg');

const NAS_DB_URL = process.env.DB_URL;
const NEON_DB_URL = process.env.NEON_DB_URL;

if (!NAS_DB_URL) {
          console.error('[sync] ERROR: DB_URL environment variable is required');
          process.exit(1);
}
if (!NEON_DB_URL) {
          console.error('[sync] ERROR: NEON_DB_URL environment variable is required');
          process.exit(1);
}

const nasPool = new Pool({ connectionString: NAS_DB_URL });
const neonPool = new Pool({ connectionString: NEON_DB_URL, ssl: { rejectUnauthorized: false } });

async function getLastSyncDate() {
          try {
                      const r = await neonPool.query('SELECT MAX(data_date) AS last_date FROM fact_performance');
                      return r.rows[0]?.last_date || null;
          } catch (e) {
                      console.log('[sync] No existing fact_performance data - doing full sync');
                      return null;
          }
}

async function fetchRowsFromNAS(lastDate) {
          let q, p;
          if (lastDate) {
                      q = 'SELECT brand, customer_id, report_date, campaign_id, campaign_name, ad_group_id, ad_group_name, impressions, clicks, cost_micros, conversions, conv_value FROM google_ads_metrics WHERE report_date > $1 ORDER BY report_date ASC';
                      p = [lastDate];
          } else {
                      q = 'SELECT brand, customer_id, report_date, campaign_id, campaign_name, ad_group_id, ad_group_name, impressions, clicks, cost_micros, conversions, conv_value FROM google_ads_metrics ORDER BY report_date ASC';
                      p = [];
          }
          const r = await nasPool.query(q, p);
          return r.rows;
}

async function resolveBrandId(client, brandName, customerId) {
          if (customerId) {
                      const r = await client.query('SELECT brand_id FROM dim_brands WHERE customer_id = $1 LIMIT 1', [String(customerId)]);
                      if (r.rows.length > 0) return r.rows[0].brand_id;
          }
          if (brandName) {
                      const r = await client.query("SELECT brand_id FROM dim_brands WHERE LOWER(brand_name) LIKE LOWER('%' || $1 || '%') LIMIT 1", [brandName]);
                      if (r.rows.length > 0) return r.rows[0].brand_id;
          }
          return null;
}

async function upsertCampaign(client, campaignId, brandId, campaignName) {
          await client.query(
                      "INSERT INTO dim_campaigns (campaign_id, brand_id, campaign_name, status, updated_at) VALUES ($1, $2, $3, 'ACTIVE', NOW()) ON CONFLICT (campaign_id) DO UPDATE SET brand_id = EXCLUDED.brand_id, campaign_name = EXCLUDED.campaign_name, updated_at = NOW()",
                      [BigInt(campaignId), brandId, campaignName]
                    );
          return BigInt(campaignId);
}

async function upsertAdGroup(client, adGroupId, campaignId, adGroupName) {
          await client.query(
                      "INSERT INTO dim_ad_groups (ad_group_id, campaign_id, ad_group_name, status, updated_at) VALUES ($1, $2, $3, 'ACTIVE', NOW()) ON CONFLICT (ad_group_id) DO UPDATE SET campaign_id = EXCLUDED.campaign_id, ad_group_name = EXCLUDED.ad_group_name, updated_at = NOW()",
                      [BigInt(adGroupId), BigInt(campaignId), adGroupName]
                    );
          return BigInt(adGroupId);
}

async function upsertFact(client, row, brandId, campaignId, adGroupId) {
          const spend = row.cost_micros ? (Number(row.cost_micros) / 1000000) : 0;
          await client.query(
                      'INSERT INTO fact_performance (brand_id, campaign_id, ad_group_id, data_date, impressions, clicks, spend, conversions, conv_value, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) ON CONFLICT (brand_id, campaign_id, ad_group_id, data_date) DO UPDATE SET impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks, spend = EXCLUDED.spend, conversions = EXCLUDED.conversions, conv_value = EXCLUDED.conv_value, updated_at = NOW()',
                      [brandId, BigInt(campaignId), BigInt(adGroupId), row.report_date, Number(row.impressions) || 0, Number(row.clicks) || 0, spend, Number(row.conversions) || 0, Number(row.conv_value) || 0]
                    );
}

async function syncNASToNeon() {
          console.log('[sync] Starting NAS -> Neon star schema sync...');
          const t0 = Date.now();
          try {
                      const lastDate = await getLastSyncDate();
                      if (lastDate) {
                                    console.log('[sync] Incremental: rows after ' + lastDate);
                      } else {
                                    console.log('[sync] Full sync: fetching all rows');
                      }
                      const rows = await fetchRowsFromNAS(lastDate);
                      console.log('[sync] Fetched ' + rows.length + ' rows from NAS');
                      if (rows.length === 0) {
                                    console.log('[sync] Nothing to sync.');
                                    return 0;
                      }
                      const client = await neonPool.connect();
                      let ok = 0, skip = 0;
                      try {
                                    await client.query('BEGIN');
                                    for (const row of rows) {
                                                    const brandId = await resolveBrandId(client, row.brand, row.customer_id);
                                                    if (!brandId) { skip++; console.warn('[sync] SKIP brand="' + row.brand + '" cid="' + row.customer_id + '"'); continue; }
                                                    const cId = await upsertCampaign(client, row.campaign_id, brandId, row.campaign_name);
                                                    const aId = await upsertAdGroup(client, row.ad_group_id, cId, row.ad_group_name);
                                                    await upsertFact(client, row, brandId, cId, aId);
                                                    ok++;
                                    }
                                    await client.query('COMMIT');
                                    console.log('[sync] Committed ' + ok + ' rows (skipped ' + skip + ')');
                      } catch (e) {
                                    await client.query('ROLLBACK');
                                    console.error('[sync] ERROR rolled back:', e.message);
                                    throw e;
                      } finally {
                                    client.release();
                      }
                      console.log('[sync] Done in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
                      return ok;
          } finally {
                      await nasPool.end();
                      await neonPool.end();
          }
}

syncNASToNeon()
  .then(function(n) { console.log('[sync] Complete: ' + n + ' rows'); process.exit(0); })
  .catch(function(e) { console.error('[sync] Fatal:', e); process.exit(1); });
