'use strict';
/**
 * NAS -> Neon Star Schema Sync Script
 * * Reads google_ads_metrics from NAS and syncs to Neon star schema.
 * * Uses DB_URL env var (same as ingest.js) for NAS PostgreSQL.
 * *
 * * dim_campaigns: campaign_id(bigint PK), remote_campaign_id(varchar NOT NULL),
 * *               customer_id(varchar NOT NULL), brand_id, campaign_name
 * * dim_ad_groups: ad_group_id(bigint PK), remote_ad_group_id(varchar NOT NULL),
 * *               campaign_id(bigint), customer_id(varchar NOT NULL), ad_group_name
 * * fact_performance unique: (customer_id, data_date, remote_campaign_id, remote_ad_group_id)
 */

const { Pool } = require('pg');

const NAS_DB_URL = process.env.DB_URL;
const NEON_DB_URL = process.env.NEON_DB_URL;

if (!NEON_DB_URL) { console.error('[sync] ERROR: NEON_DB_URL environment variable is required'); process.exit(1); }
if (!NAS_DB_URL) { console.error('[sync] ERROR: DB_URL environment variable is required'); process.exit(1); }

const nasPool = new Pool({ connectionString: NAS_DB_URL });
const neonPool = new Pool({ connectionString: NEON_DB_URL, ssl: { rejectUnauthorized: false } });

async function getLastSyncDate(client) {
    const res = await client.query('SELECT MAX(data_date) AS last_date FROM fact_performance');
    return res.rows[0].last_date;
}

async function getBrandMap(client) {
    const res = await client.query('SELECT brand_id, brand_name FROM dim_brands');
    const map = {};
    for (const row of res.rows) {
          map[row.brand_name.toLowerCase()] = row.brand_id;
    }
    return map;
}

async function upsertCampaign(client, row, brandId) {
    const campaignId = BigInt(row.campaign_id);
    await client.query(`
        INSERT INTO dim_campaigns (campaign_id, remote_campaign_id, customer_id, brand_id, campaign_name, status, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'ENABLED', NOW())
                ON CONFLICT (campaign_id) DO UPDATE SET
                      campaign_name = EXCLUDED.campaign_name,
                            brand_id = EXCLUDED.brand_id,
                                  updated_at = NOW()
                                    `, [campaignId, String(row.campaign_id), String(row.customer_id), brandId, row.campaign_name]);
}

async function upsertAdGroup(client, row, brandId) {
    const adGroupId = BigInt(row.ad_group_id);
    const campaignId = BigInt(row.campaign_id);
    await client.query(`
        INSERT INTO dim_ad_groups (ad_group_id, remote_ad_group_id, campaign_id, customer_id, ad_group_name, status, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'ENABLED', NOW())
                ON CONFLICT (ad_group_id) DO UPDATE SET
                      ad_group_name = EXCLUDED.ad_group_name,
                            updated_at = NOW()
                              `, [adGroupId, String(row.ad_group_id), campaignId, String(row.customer_id), row.ad_group_name]);
}

async function upsertFact(client, row, brandId) {
    const campaignId = BigInt(row.campaign_id);
    const adGroupId = BigInt(row.ad_group_id);
    await client.query(`
        INSERT INTO fact_performance (
              data_date, brand_id, campaign_id, ad_group_id,
                    customer_id, remote_campaign_id, remote_ad_group_id,
                          impressions, clicks, cost_micros, conversions, conversion_value,
                                fetched_at
                                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW())
                                        ON CONFLICT (customer_id, data_date, remote_campaign_id, remote_ad_group_id) DO UPDATE SET
                                              brand_id = EXCLUDED.brand_id,
                                                    campaign_id = EXCLUDED.campaign_id,
                                                          ad_group_id = EXCLUDED.ad_group_id,
                                                                impressions = EXCLUDED.impressions,
                                                                      clicks = EXCLUDED.clicks,
                                                                            cost_micros = EXCLUDED.cost_micros,
                                                                                  conversions = EXCLUDED.conversions,
                                                                                        conversion_value = EXCLUDED.conversion_value,
                                                                                              fetched_at = NOW()
                                                                                                `, [
          row.report_date,
          brandId,
          campaignId,
          adGroupId,
          String(row.customer_id),
          String(row.campaign_id),
          String(row.ad_group_id),
          row.impressions || 0,
          row.clicks || 0,
          row.cost_micros || 0,
          row.conversions || 0,
          row.conv_value || 0
        ]);
}

async function main() {
    console.log('[sync] Starting NAS -> Neon star schema sync...');
    const neonClient = await neonPool.connect();
    const nasClient = await nasPool.connect();

  try {
        const lastDate = await getLastSyncDate(neonClient);
        if (lastDate) {
                console.log('[sync] Incremental sync from:', lastDate);
        } else {
                console.log('[sync] No existing fact_performance data - doing full sync');
        }

      const brandMap = await getBrandMap(neonClient);

      const query = lastDate
          ? `SELECT * FROM google_ads_metrics WHERE report_date > $1 ORDER BY report_date`
              : `SELECT * FROM google_ads_metrics ORDER BY report_date`;
        const params = lastDate ? [lastDate] : [];

      const nasResult = await nasClient.query(query, params);
        const rows = nasResult.rows;
        console.log(`[sync] Full sync`);
        console.log(`[sync] Fetched ${rows.length} rows from NAS`);

      if (rows.length === 0) {
              console.log('[sync] No new rows to sync. Exiting.');
              return;
      }

      await neonClient.query('BEGIN');
        let inserted = 0;
        for (const row of rows) {
                const brandKey = (row.brand || '').toLowerCase();
                const brandId = brandMap[brandKey] || null;
                await upsertCampaign(neonClient, row, brandId);
                await upsertAdGroup(neonClient, row, brandId);
                await upsertFact(neonClient, row, brandId);
                inserted++;
        }
        await neonClient.query('COMMIT');
        console.log(`[sync] Successfully synced ${inserted} rows to Neon`);

  } catch (err) {
        await neonClient.query('ROLLBACK').catch(() => {});
        console.error('[sync] ERROR rolled back:', err.message);
        console.error('[sync] Fatal:', err.message);
        process.exit(1);
  } finally {
        nasClient.release();
        neonClient.release();
        await nasPool.end();
        await neonPool.end();
  }
}

main();
