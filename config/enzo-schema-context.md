# Enzo Schema Context — Google Ads Metrics

You have access to Google Ads performance data in PostgreSQL. Use this schema knowledge to write accurate SQL queries.

## Database Connection
- **Primary**: NAS PostgreSQL (slack_channel_matrix database, port 5433)
- **Replica**: Neon Serverless (read-only, Singapore region)

## Main Table: `google_ads_metrics`

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| brand | varchar(120) | Brand name (e.g., "Radiant Waxing", "Amazing Lash Studio") |
| customer_id | varchar(20) | Google Ads customer ID |
| report_date | date | Performance date |
| campaign_id | varchar(30) | Campaign ID |
| campaign_name | varchar(255) | Campaign name |
| ad_group_id | varchar(30) | Ad group ID |
| ad_group_name | varchar(255) | Ad group name |
| impressions | bigint | Number of impressions |
| clicks | bigint | Number of clicks |
| cost_micros | bigint | Cost in micros (divide by 1,000,000 for dollars) |
| conversions | numeric | Number of conversions |
| conv_value | numeric | Conversion value |
| fetched_at | timestamp | When data was ingested |

## Brand Portfolio

| Brand | Customer ID | Notes |
|-------|-------------|-------|
| Radiant Waxing | 7008801468 | Active |
| Paused Studio | 9456534996 | Active |
| Amazing Lash Studio | 5184398848 | Active |
| Drybar | 5692576556 | Active |
| The Joint Chiropractic | 4805941762 | MCC Parent (no direct metrics) |
| Geeko Master MCC | 5030153115 | MCC Parent (no direct metrics) |

## Common Query Patterns

### Total spend by brand (last 7 days)
```sql
SELECT 
    brand,
    ROUND(SUM(cost_micros) / 1000000.0, 2) AS spend,
    SUM(impressions) AS impressions,
    SUM(clicks) AS clicks
FROM google_ads_metrics
WHERE report_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY brand
ORDER BY spend DESC;
```

### Daily spend trend for a brand
```sql
SELECT 
    report_date,
    ROUND(SUM(cost_micros) / 1000000.0, 2) AS spend,
    SUM(clicks) AS clicks,
    SUM(conversions) AS conversions
FROM google_ads_metrics
WHERE brand = 'Radiant Waxing'
  AND report_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY report_date
ORDER BY report_date;
```

### Top campaigns by spend
```sql
SELECT 
    brand,
    campaign_name,
    ROUND(SUM(cost_micros) / 1000000.0, 2) AS spend,
    SUM(clicks) AS clicks,
    CASE WHEN SUM(clicks) > 0 
         THEN ROUND(SUM(cost_micros) / 1000000.0 / SUM(clicks), 2) 
         ELSE 0 END AS cpc
FROM google_ads_metrics
WHERE report_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY brand, campaign_name
ORDER BY spend DESC
LIMIT 10;
```

### CTR and CPC by ad group
```sql
SELECT 
    ad_group_name,
    SUM(impressions) AS impressions,
    SUM(clicks) AS clicks,
    ROUND(SUM(clicks) * 100.0 / NULLIF(SUM(impressions), 0), 2) AS ctr,
    ROUND(SUM(cost_micros) / 1000000.0 / NULLIF(SUM(clicks), 0), 2) AS cpc
FROM google_ads_metrics
WHERE brand = 'Amazing Lash Studio'
  AND report_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY ad_group_name
ORDER BY ctr DESC;
```

## Important Notes

1. **cost_micros**: Always divide by 1,000,000 to get dollar amounts
2. **MCC accounts**: The Joint (4805941762) and Geeko Master (5030153115) are parent accounts — they have no metrics rows
3. **Date range**: Data is refreshed daily; always specify a date range in queries
4. **Unique key**: (customer_id, report_date, campaign_id, ad_group_id)
