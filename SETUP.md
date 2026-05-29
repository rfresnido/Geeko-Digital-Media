# Geeko Data Pipeline — Setup Guide

## Architecture Overview

```
NAS (Primary)                    Neon (Read Replica)
┌─────────────────┐             ┌─────────────────┐
│ slack_channel_  │────sync────▶│     neondb      │
│ matrix          │             │                 │
│ ┌─────────────┐ │             │ ┌─────────────┐ │
│ │google_ads_  │ │             │ │google_ads_  │ │
│ │metrics      │ │             │ │metrics      │ │
│ └─────────────┘ │             │ └─────────────┘ │
└────────┬────────┘             └─────────────────┘
         │
    Enzo queries
```

## Step 1: Initialize Neon Schema

1. Open Neon console or connect via pgAdmin to your Neon database
2. Run the schema script:

```bash
psql $NEON_DB_URL -f schema/neon-google-ads-metrics.sql
```

Or copy-paste the contents of `schema/neon-google-ads-metrics.sql` into the Neon SQL editor.

## Step 2: Configure Environment Variables

On your Synology NAS, set these environment variables (or create a `.env` file):

```bash
# NAS PostgreSQL (your local database)
NAS_DB_URL=postgresql://geeky_admin:YOUR_PASSWORD@localhost:5433/slack_channel_matrix

# Neon PostgreSQL (cloud replica)
NEON_DB_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

## Step 3: Install Dependencies

```bash
cd scripts
npm install
```

## Step 4: Run Initial Sync

```bash
cd scripts
npm run sync
```

This will copy all existing rows from NAS → Neon.

## Step 5: Schedule Recurring Sync

Add to Synology Task Scheduler (run after ingest.js):

```bash
cd /volume1/docker/geeko-data/scripts && node sync-nas-to-neon.js >> /var/log/neon-sync.log 2>&1
```

Recommended: Run 5 minutes after ingest.js completes.

## Step 6: Update Enzo System Prompt

Add the contents of `config/enzo-schema-context.md` to Enzo's system prompt so it understands the database schema.

---

## Verification

After sync, verify data in Neon:

```sql
-- Check row count
SELECT COUNT(*) FROM google_ads_metrics;

-- Check by brand
SELECT brand, COUNT(*) as rows, MAX(report_date) as latest
FROM google_ads_metrics
GROUP BY brand;

-- Test the dollars view
SELECT brand, report_date, spend, clicks, cpc
FROM google_ads_metrics_dollars
WHERE report_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY spend DESC
LIMIT 10;
```

## Troubleshooting

### "relation does not exist"
Run `schema/neon-google-ads-metrics.sql` in Neon first.

### "connection error to Neon"
- Check NEON_DB_URL is correct
- Ensure SSL is enabled (`?sslmode=require`)
- Verify Cloudflare tunnel is up (if routing through it)

### Sync shows 0 rows
- Check NAS has data: `SELECT COUNT(*) FROM google_ads_metrics;`
- Verify NAS_DB_URL connection string is correct
