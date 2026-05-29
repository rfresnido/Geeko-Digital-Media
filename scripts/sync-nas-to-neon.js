'use strict';
/**
 * NAS -> Neon Star Schema Sync Script (v2 - optimized)
 * Uses deduplicated dim inserts + individual fact upserts.
 */

const { Pool } = require('pg');

const NAS_DB_URL = process.env.DB_URL;
const NEON_DB_URL = process.env.NEON_DB_URL;

if (!NEON_DB_URL) { console.error('[sync] ERROR: NEON_DB_URL required'); process.exit(1); }
if (!NAS_DB_URL) { console.error('[sync] ERROR: DB_URL required'); process.exit(1); }

const nasPool = new Pool({ connectionString: NAS_DB_URL });
const neonPool = new Pool({ connectionString: NEON_DB_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  console.log('[sync] Starting NAS -> Neon star schema sync...');
  const neonClient = await neonPool.connect();
  const nasClient = await nasPool.connect();

  try {
    const lastDateRes = await neonClient.query('SELECT MAX(data_date) AS last_date FROM fact_performance');
    const lastDate = lastDateRes.rows[0].last_date;
    console.log(lastDate ? `[sync] Incremental sync from: ${lastDate}` : '[sync] Full sync - no existing data');

    const brandRes = await neonClient.query('SELECT brand_id, brand_name FROM dim_brands');
    const brandMap = {};
    for (const b of brandRes.rows) brandMap[b.brand_name.toLowerCase()] = b.brand_id;

    const query = lastDate
      ? 'SELECT * FROM google_ads_metrics WHERE report_date > $1 ORDER BY report_date'
      : 'SELECT * FROM google_ads_metrics ORDER BY report_date';
    const nasResult = await nasClient.query(query, lastDate ? [lastDate] : []);
    const rows = nasResult.rows;
    console.log(`[sync] Fetched ${rows.length} rows from NAS`);
    if (rows.length === 0) { console.log('[sync] No new rows. Done.'); return; }

    await neonClient.query('BEGIN');

    // Deduplicate and upsert dim_campaigns
    const campaignsSeen = new Map();
    for (const row of rows) {
      const key = String(row.campaign_id);
      if (!campaignsSeen.has(key)) {
        campaignsSeen.set(key, {
          id: BigInt(row.campaign_id), rid: key,
          cid: String(row.customer_id),
          bid: brandMap[(row.brand||'').toLowerCase()]||null,
          name: row.campaign_name
        });
      }
    }
    for (const c of campaignsSeen.values()) {
      await neonClient.query(
        `INSERT INTO dim_campaigns (campaign_id,remote_campaign_id,customer_id,brand_id,campaign_name,status,updated_at)
         VALUES ($1,$2,$3,$4,$5,'ENABLED',NOW())
         ON CONFLICT (campaign_id) DO UPDATE SET campaign_name=EXCLUDED.campaign_name,brand_id=EXCLUDED.brand_id,updated_at=NOW()`,
        [c.id, c.rid, c.cid, c.bid, c.name]
      );
    }
    console.log(`[sync] Upserted ${campaignsSeen.size} campaigns`);

    // Deduplicate and upsert dim_ad_groups
    const adGroupsSeen = new Map();
    for (const row of rows) {
      const key = String(row.ad_group_id);
      if (!adGroupsSeen.has(key)) {
        adGroupsSeen.set(key, {
          id: BigInt(row.ad_group_id), rid: key,
          campId: BigInt(row.campaign_id),
          cid: String(row.customer_id),
          name: row.ad_group_name
        });
      }
    }
    for (const ag of adGroupsSeen.values()) {
      await neonClient.query(
        `INSERT INTO dim_ad_groups (ad_group_id,remote_ad_group_id,campaign_id,customer_id,ad_group_name,status,updated_at)
         VALUES ($1,$2,$3,$4,$5,'ENABLED',NOW())
         ON CONFLICT (ad_group_id) DO UPDATE SET ad_group_name=EXCLUDED.ad_group_name,updated_at=NOW()`,
        [ag.id, ag.rid, ag.campId, ag.cid, ag.name]
      );
    }
    console.log(`[sync] Upserted ${adGroupsSeen.size} ad groups`);

    // Upsert fact_performance
    let inserted = 0;
    for (const row of rows) {
      const brandId = brandMap[(row.brand||'').toLowerCase()]||null;
      await neonClient.query(
        `INSERT INTO fact_performance (data_date,brand_id,campaign_id,ad_group_id,customer_id,remote_campaign_id,remote_ad_group_id,impressions,clicks,cost_micros,conversions,conversion_value,fetched_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
         ON CONFLICT (customer_id,data_date,remote_campaign_id,remote_ad_group_id) DO UPDATE SET
           brand_id=EXCLUDED.brand_id,campaign_id=EXCLUDED.campaign_id,ad_group_id=EXCLUDED.ad_group_id,
           impressions=EXCLUDED.impressions,clicks=EXCLUDED.clicks,cost_micros=EXCLUDED.cost_micros,
           conversions=EXCLUDED.conversions,conversion_value=EXCLUDED.conversion_value,fetched_at=NOW()`,
        [row.report_date, brandId, BigInt(row.campaign_id), BigInt(row.ad_group_id),
         String(row.customer_id), String(row.campaign_id), String(row.ad_group_id),
         row.impressions||0, row.clicks||0, row.cost_micros||0, row.conversions||0, row.conv_value||0]
      );
      inserted++;
    }

    await neonClient.query('COMMIT');
    console.log(`[sync] SUCCESS: ${inserted} fact rows, ${campaignsSeen.size} campaigns, ${adGroupsSeen.size} ad groups`);

  } catch (err) {
    await neonClient.query('ROLLBACK').catch(()=>{});
    console.error('[sync] ERROR:', err.message);
    process.exit(1);
  } finally {
    nasClient.release();
    neonClient.release();
    await nasPool.end();
    await neonPool.end();
  }
}

main();
