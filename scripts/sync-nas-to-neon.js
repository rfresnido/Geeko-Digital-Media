'use strict';
/**
 * NAS -> Neon Star Schema Sync Script
 * Syncs google_ads_metrics from NAS to the Neon fact_performance table.
 * Uses DB_URL (same env var as ingest.js) for NAS connection.
 *
 * fact_performance schema:
 *   data_date, brand_id, campaign_id (bigint FK), ad_group_id (bigint FK),
 *   customer_id, remote_campaign_id, remote_ad_group_id,
 *   impressions, clicks, cost_micros, conversions, conversion_value
 * Unique constraint: (customer_id, data_date, remote_campaign_id, remote_ad_group_id)
 */

const { Pool } = require('pg');

const NAS_DB_URL = process.env.DB_URL;
const NEON_DB_URL = process.env.NEON_DB_URL;

if (!NAS_DB_URL) { console.error('[sync] ERROR: DB_URL is required'); process.exit(1); }
if (!NEON_DB_URL) { console.error('[sync] ERROR: NEON_DB_URL is required'); process.exit(1); }

const nasPool = new Pool({ connectionString: NAS_DB_URL });
const neonPool = new Pool({ connectionString: NEON_DB_URL, ssl: { rejectUnauthorized: false } });

async function getLastSyncDate() {
            try {
                          const r = await neonPool.query('SELECT MAX(data_date) AS d FROM fact_performance');
                          return r.rows[0]?.d || null;
            } catch (e) { return null; }
}

async function fetchRowsFromNAS(lastDate) {
            if (lastDate) {
                          const r = await nasPool.query(
                                          'SELECT brand, customer_id, report_date, campaign_id, campaign_name, ad_group_id, ad_group_name, impressions, clicks, cost_micros, conversions, conv_value FROM google_ads_metrics WHERE report_date > $1 ORDER BY report_date ASC',
                                          [lastDate]
                                        );
                          return r.rows;
            }
            const r = await nasPool.query(
                          'SELECT brand, customer_id, report_date, campaign_id, campaign_name, ad_group_id, ad_group_name, impressions, clicks, cost_micros, conversions, conv_value FROM google_ads_metrics ORDER BY report_date ASC'
                        );
            return r.rows;
}

async function resolveBrandId(client, brandName, customerId) {
            if (customerId) {
                          const r = await client.query('SELECT brand_id FROM dim_brands WHERE customer_id = $1 LIMIT 1', [String(customerId)]);
                          if (r.rows.length) return r.rows[0].brand_id;
            }
            if (brandName) {
                          const r = await client.query("SELECT brand_id FROM dim_brands WHERE LOWER(brand_name) LIKE LOWER('%' || $1 || '%') LIMIT 1", [brandName]);
                          if (r.rows.length) return r.rows[0].brand_id;
            }
            return null;
}

async function upsertCampaign(client, campaignId, brandId, campaignName) {
            await client.query(
                          "INSERT INTO dim_campaigns (campaign_id, brand_id, campaign_name, status, updated_at) VALUES ($1, $2, $3, 'ACTIVE', NOW()) ON CONFLICT (campaign_id) DO UPDATE SET brand_id=EXCLUDED.brand_id, campaign_name=EXCLUDED.campaign_name, updated_at=NOW()",
                          [BigInt(campaignId), brandId, campaignName]
                        );
}

async function upsertAdGroup(client, adGroupId, campaignId, adGroupName) {
            await client.query(
                          "INSERT INTO dim_ad_groups (ad_group_id, campaign_id, ad_group_name, status, updated_at) VALUES ($1, $2, $3, 'ACTIVE', NOW()) ON CONFLICT (ad_group_id) DO UPDATE SET campaign_id=EXCLUDED.campaign_id, ad_group_name=EXCLUDED.ad_group_name, updated_at=NOW()",
                          [BigInt(adGroupId), BigInt(campaignId), adGroupName]
                        );
}

async function upsertFact(client, row, brandId) {
            await client.query(
                          'INSERT INTO fact_performance (data_date, brand_id, campaign_id, ad_group_id, customer_id, remote_campaign_id, remote_ad_group_id, impressions, clicks, cost_micros, conversions, conversion_value, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) ON CONFLICT (customer_id, data_date, remote_campaign_id, remote_ad_group_id) DO UPDATE SET brand_id=EXCLUDED.brand_id, campaign_id=EXCLUDED.campaign_id, ad_group_id=EXCLUDED.ad_group_id, impressions=EXCLUDED.impressions, clicks=EXCLUDED.clicks, cost_micros=EXCLUDED.cost_micros, conversions=EXCLUDED.conversions, conversion_value=EXCLUDED.conversion_value, updated_at=NOW()',
                          [
                                          row.report_date,
                                          brandId,
                                          BigInt(row.campaign_id),
                                          BigInt(row.ad_group_id),
                                          String(row.customer_id),
                                          String(row.campaign_id),
                                          String(row.ad_group_id),
                                          BigInt(Number(row.impressions) || 0),
                                          BigInt(Number(row.clicks) || 0),
                                          BigInt(Number(row.cost_micros) || 0),
                                          Number(row.conversions) || 0,
                                          Number(row.conv_value) || 0
                                        ]
                        );
}

async function syncNASToNeon() {
            console.log('[sync] Starting NAS -> Neon sync...');
            const t0 = Date.now();
            try {
                          const lastDate = await getLastSyncDate();
                          console.log(lastDate ? '[sync] Incremental: rows after ' + lastDate : '[sync] Full sync');
                          const rows = await fetchRowsFromNAS(lastDate);
                          console.log('[sync] Fetched ' + rows.length + ' rows from NAS');
                          if (!rows.length) { console.log('[sync] Up to date.'); return 0; }

              const client = await neonPool.connect();
                          let ok = 0, skip = 0;
                          try {
                                          await client.query('BEGIN');
                                          for (const row of rows) {
                                                            const brandId = await resolveBrandId(client, row.brand, row.customer_id);
                                                            if (!brandId) { skip++; console.warn('[sync] SKIP no brand: ' + row.brand + ' / ' + row.customer_id); continue; }
                                                            await upsertCampaign(client, row.campaign_id, brandId, row.campaign_name);
                                                            await upsertAdGroup(client, row.ad_group_id, row.campaign_id, row.ad_group_name);
                                                            await upsertFact(client, row, brandId);
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
                          console.log('[sync] Done in ' + ((Date.now()-t0)/1000).toFixed(1) + 's');
                          return ok;
            } finally {
                          await nasPool.end();
                          await neonPool.end();
            }
}

syncNASToNeon()
  .then(function(n) { console.log('[sync] Complete: ' + n + ' rows upserted'); process.exit(0); })
  .catch(function(e) { console.error('[sync] Fatal:', e.message, e.detail || ''); process.exit(1); });
