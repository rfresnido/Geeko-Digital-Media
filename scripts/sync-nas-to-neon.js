/**
 * NAS → Neon Sync Script
 *
 * Syncs google_ads_metrics from local NAS PostgreSQL to Neon cloud replica.
 * Run via Synology Task Scheduler after ingest.js completes.
 *
 * Environment Variables:
 *   NAS_DB_URL   - Local NAS PostgreSQL connection string
 *   NEON_DB_URL  - Neon serverless PostgreSQL connection string
 */

import pg from 'pg';
const { Pool } = pg;

// Configuration
const NAS_DB_URL = process.env.NAS_DB_URL || 'postgresql://geeky_admin:password@localhost:5433/slack_channel_matrix';
const NEON_DB_URL = process.env.NEON_DB_URL;

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
 * Get the latest fetched_at timestamp from Neon to determine sync point
 */
async function getLastSyncTimestamp() {
    try {
        const result = await neonPool.query(
            'SELECT MAX(fetched_at) as last_sync FROM google_ads_metrics'
        );
        return result.rows[0]?.last_sync || null;
    } catch (error) {
        // Table might not exist yet
        console.log('[sync] No existing data in Neon, will do full sync');
        return null;
    }
}

/**
 * Fetch new rows from NAS since last sync
 */
async function fetchNewRowsFromNAS(since) {
    let query, params;

    if (since) {
        query = `
            SELECT brand, customer_id, report_date, campaign_id, campaign_name,
                   ad_group_id, ad_group_name, impressions, clicks, cost_micros,
                   conversions, conv_value, fetched_at
            FROM google_ads_metrics
            WHERE fetched_at > $1
            ORDER BY fetched_at ASC
        `;
        params = [since];
    } else {
        // Full sync
        query = `
            SELECT brand, customer_id, report_date, campaign_id, campaign_name,
                   ad_group_id, ad_group_name, impressions, clicks, cost_micros,
                   conversions, conv_value, fetched_at
            FROM google_ads_metrics
            ORDER BY fetched_at ASC
        `;
        params = [];
    }

    const result = await nasPool.query(query, params);
    return result.rows;
}

/**
 * Upsert rows into Neon
 */
async function upsertToNeon(rows) {
    if (rows.length === 0) {
        console.log('[sync] No new rows to sync');
        return 0;
    }

    const client = await neonPool.connect();
    let syncedCount = 0;

    try {
        await client.query('BEGIN');

        const upsertQuery = `
            INSERT INTO google_ads_metrics (
                brand, customer_id, report_date, campaign_id, campaign_name,
                ad_group_id, ad_group_name, impressions, clicks, cost_micros,
                conversions, conv_value, fetched_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (customer_id, report_date, campaign_id, ad_group_id)
            DO UPDATE SET
                brand = EXCLUDED.brand,
                campaign_name = EXCLUDED.campaign_name,
                ad_group_name = EXCLUDED.ad_group_name,
                impressions = EXCLUDED.impressions,
                clicks = EXCLUDED.clicks,
                cost_micros = EXCLUDED.cost_micros,
                conversions = EXCLUDED.conversions,
                conv_value = EXCLUDED.conv_value,
                fetched_at = EXCLUDED.fetched_at
        `;

        for (const row of rows) {
            await client.query(upsertQuery, [
                row.brand,
                row.customer_id,
                row.report_date,
                row.campaign_id,
                row.campaign_name,
                row.ad_group_id,
                row.ad_group_name,
                row.impressions,
                row.clicks,
                row.cost_micros,
                row.conversions,
                row.conv_value,
                row.fetched_at
            ]);
            syncedCount++;
        }

        await client.query('COMMIT');
        console.log(`[sync] Successfully synced ${syncedCount} rows to Neon`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[sync] Error during upsert, rolled back:', error.message);
        throw error;
    } finally {
        client.release();
    }

    return syncedCount;
}

/**
 * Main sync function
 */
async function syncNASToNeon() {
    console.log('[sync] Starting NAS → Neon sync...');
    const startTime = Date.now();

    try {
        // Get last sync point
        const lastSync = await getLastSyncTimestamp();
        if (lastSync) {
            console.log(`[sync] Last sync timestamp: ${lastSync.toISOString()}`);
        }

        // Fetch new rows from NAS
        const newRows = await fetchNewRowsFromNAS(lastSync);
        console.log(`[sync] Found ${newRows.length} rows to sync`);

        // Upsert to Neon
        const synced = await upsertToNeon(newRows);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[sync] Sync complete in ${elapsed}s — ${synced} rows synced`);

    } catch (error) {
        console.error('[sync] Sync failed:', error.message);
        process.exit(1);
    } finally {
        await nasPool.end();
        await neonPool.end();
    }
}

// Run
syncNASToNeon();
