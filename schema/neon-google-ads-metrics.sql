-- Neon Cloud Replica Schema
-- Run this in Neon to create the google_ads_metrics table
-- Matches the NAS (slack_channel_matrix) schema exactly

CREATE TABLE IF NOT EXISTS google_ads_metrics (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(120) NOT NULL,
    customer_id VARCHAR(20) NOT NULL,
    report_date DATE NOT NULL,
    campaign_id VARCHAR(30),
    campaign_name VARCHAR(255),
    ad_group_id VARCHAR(30),
    ad_group_name VARCHAR(255),
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    cost_micros BIGINT DEFAULT 0,
    conversions NUMERIC(12,4) DEFAULT 0,
    conv_value NUMERIC(12,2) DEFAULT 0,
    fetched_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_metric_row UNIQUE (customer_id, report_date, campaign_id, ad_group_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_gam_brand ON google_ads_metrics(brand);
CREATE INDEX IF NOT EXISTS idx_gam_report_date ON google_ads_metrics(report_date);
CREATE INDEX IF NOT EXISTS idx_gam_customer_id ON google_ads_metrics(customer_id);
CREATE INDEX IF NOT EXISTS idx_gam_brand_date ON google_ads_metrics(brand, report_date);

-- Helpful view: spend in dollars instead of micros
CREATE OR REPLACE VIEW google_ads_metrics_dollars AS
SELECT
    id,
    brand,
    customer_id,
    report_date,
    campaign_id,
    campaign_name,
    ad_group_id,
    ad_group_name,
    impressions,
    clicks,
    cost_micros,
    ROUND(cost_micros / 1000000.0, 2) AS spend,
    conversions,
    conv_value,
    CASE WHEN clicks > 0 THEN ROUND(cost_micros / 1000000.0 / clicks, 2) ELSE 0 END AS cpc,
    CASE WHEN impressions > 0 THEN ROUND(clicks * 100.0 / impressions, 2) ELSE 0 END AS ctr,
    fetched_at
FROM google_ads_metrics;

COMMENT ON TABLE google_ads_metrics IS 'Google Ads performance metrics synced from NAS primary';
COMMENT ON VIEW google_ads_metrics_dollars IS 'Convenience view with spend converted from micros to dollars';
