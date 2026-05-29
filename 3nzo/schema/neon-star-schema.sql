-- 3nzo Star Schema for Neon PostgreSQL
-- Geeko Digital Media - Paid Media Data Warehouse
--
-- Architecture:
--   dim_brands        → Brand/Account master
--   dim_campaigns     → Campaign details + mutable state
--   dim_ad_groups     → Ad group details + mutable state
--   fact_performance  → Daily metrics (standard + competitive)
--   enzo_mutations    → Audit log of 3Nzo actions

-- ============================================
-- DIMENSION: Brands / Accounts
-- ============================================
CREATE TABLE IF NOT EXISTS dim_brands (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(120) NOT NULL,
    customer_id VARCHAR(20) NOT NULL UNIQUE,
    platform VARCHAR(20) DEFAULT 'google_ads',
    is_mcc BOOLEAN DEFAULT FALSE,
    parent_mcc_id VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed known brands
INSERT INTO dim_brands (brand_name, customer_id, is_mcc) VALUES
    ('Radiant Waxing', '7008801468', FALSE),
    ('Paused Studio', '9456534996', FALSE),
    ('Amazing Lash Studio', '5184398848', FALSE),
    ('Drybar', '5692576556', FALSE),
    ('The Joint Chiropractic', '4805941762', TRUE),
    ('Geeko Master MCC', '5030153115', TRUE)
ON CONFLICT (customer_id) DO NOTHING;

-- ============================================
-- DIMENSION: Campaigns (with mutable state)
-- ============================================
CREATE TABLE IF NOT EXISTS dim_campaigns (
    campaign_id SERIAL PRIMARY KEY,
    remote_campaign_id VARCHAR(30) NOT NULL,
    brand_id INTEGER REFERENCES dim_brands(brand_id),
    customer_id VARCHAR(20) NOT NULL,
    campaign_name VARCHAR(255),
    campaign_type VARCHAR(50),
    advertising_channel VARCHAR(50),

    -- Mutable state (updated by 3Nzo)
    status VARCHAR(20) DEFAULT 'ENABLED',
    daily_budget_micros BIGINT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_synced_at TIMESTAMP,

    CONSTRAINT unique_campaign UNIQUE (customer_id, remote_campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON dim_campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON dim_campaigns(status);

-- ============================================
-- DIMENSION: Ad Groups (with mutable state)
-- ============================================
CREATE TABLE IF NOT EXISTS dim_ad_groups (
    ad_group_id SERIAL PRIMARY KEY,
    remote_ad_group_id VARCHAR(30) NOT NULL,
    campaign_id INTEGER REFERENCES dim_campaigns(campaign_id),
    customer_id VARCHAR(20) NOT NULL,
    ad_group_name VARCHAR(255),
    ad_group_type VARCHAR(50),

    -- Mutable state (updated by 3Nzo)
    status VARCHAR(20) DEFAULT 'ENABLED',
    cpc_bid_micros BIGINT,
    target_cpa_micros BIGINT,
    target_roas NUMERIC(5,2),

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_synced_at TIMESTAMP,

    CONSTRAINT unique_ad_group UNIQUE (customer_id, remote_ad_group_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_groups_campaign ON dim_ad_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_groups_status ON dim_ad_groups(status);

-- ============================================
-- FACT: Daily Performance Metrics
-- ============================================
CREATE TABLE IF NOT EXISTS fact_performance (
    fact_id SERIAL PRIMARY KEY,
    data_date DATE NOT NULL,

    -- Dimension FKs
    brand_id INTEGER REFERENCES dim_brands(brand_id),
    campaign_id INTEGER REFERENCES dim_campaigns(campaign_id),
    ad_group_id INTEGER REFERENCES dim_ad_groups(ad_group_id),

    -- Denormalized IDs (for faster queries)
    customer_id VARCHAR(20) NOT NULL,
    remote_campaign_id VARCHAR(30),
    remote_ad_group_id VARCHAR(30),

    -- Standard Metrics
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    cost_micros BIGINT DEFAULT 0,
    conversions NUMERIC(12,4) DEFAULT 0,
    conversion_value NUMERIC(12,2) DEFAULT 0,

    -- Competitive Metrics (Search)
    search_impression_share NUMERIC(5,4),         -- 0.0000 to 1.0000
    search_lost_is_budget NUMERIC(5,4),           -- Lost IS due to budget
    search_lost_is_rank NUMERIC(5,4),             -- Lost IS due to rank
    search_exact_match_is NUMERIC(5,4),
    search_top_is NUMERIC(5,4),                   -- Top impression share
    search_abs_top_is NUMERIC(5,4),               -- Absolute top IS

    -- Video Metrics (for future)
    video_views BIGINT DEFAULT 0,
    video_view_rate NUMERIC(5,4),

    -- Raw payload for debugging
    raw_payload JSONB,

    -- Metadata
    fetched_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_fact UNIQUE (customer_id, data_date, remote_campaign_id, remote_ad_group_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_fact_date ON fact_performance(data_date);
CREATE INDEX IF NOT EXISTS idx_fact_brand ON fact_performance(brand_id);
CREATE INDEX IF NOT EXISTS idx_fact_campaign ON fact_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fact_date_brand ON fact_performance(data_date, brand_id);
CREATE INDEX IF NOT EXISTS idx_fact_customer_date ON fact_performance(customer_id, data_date);

-- ============================================
-- AUDIT: 3nzo Mutations Log
-- ============================================
CREATE TABLE IF NOT EXISTS enzo_mutations (
    mutation_id SERIAL PRIMARY KEY,

    -- What was changed
    entity_type VARCHAR(20) NOT NULL,             -- 'campaign', 'ad_group'
    entity_id INTEGER,                            -- FK to dim table
    remote_entity_id VARCHAR(30),                 -- Google Ads ID
    customer_id VARCHAR(20),

    -- The change
    action VARCHAR(50) NOT NULL,                  -- 'pause', 'enable', 'set_budget', 'set_bid'
    field_changed VARCHAR(50),                    -- 'status', 'daily_budget_micros', 'cpc_bid_micros'
    old_value TEXT,
    new_value TEXT,

    -- Execution details
    composio_action_id VARCHAR(100),              -- Composio execution reference
    execution_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
    error_message TEXT,

    -- Context
    triggered_by VARCHAR(50) DEFAULT '3nzo',      -- '3nzo', 'slack', 'dashboard'
    user_message TEXT,                            -- Original user request

    -- Timestamps
    requested_at TIMESTAMP DEFAULT NOW(),
    executed_at TIMESTAMP,

    CONSTRAINT valid_entity_type CHECK (entity_type IN ('campaign', 'ad_group', 'brand'))
);

CREATE INDEX IF NOT EXISTS idx_mutations_entity ON enzo_mutations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mutations_date ON enzo_mutations(requested_at);
CREATE INDEX IF NOT EXISTS idx_mutations_status ON enzo_mutations(execution_status);

-- ============================================
-- VIEWS: Convenience Aggregations
-- ============================================

-- Campaign-level daily summary
CREATE OR REPLACE VIEW v_campaign_daily AS
SELECT
    f.data_date,
    b.brand_name,
    c.campaign_name,
    c.status AS campaign_status,
    ROUND(c.daily_budget_micros / 1000000.0, 2) AS daily_budget,
    SUM(f.impressions) AS impressions,
    SUM(f.clicks) AS clicks,
    ROUND(SUM(f.cost_micros) / 1000000.0, 2) AS spend,
    SUM(f.conversions) AS conversions,
    ROUND(SUM(f.conversion_value), 2) AS conv_value,
    -- Calculated metrics
    ROUND(SUM(f.clicks) * 100.0 / NULLIF(SUM(f.impressions), 0), 2) AS ctr,
    ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.clicks), 0), 2) AS cpc,
    ROUND(SUM(f.conversions) / NULLIF(SUM(f.clicks), 0) * 100, 2) AS conv_rate,
    -- Competitive metrics (average across ad groups)
    ROUND(AVG(f.search_impression_share) * 100, 2) AS search_is_pct,
    ROUND(AVG(f.search_lost_is_budget) * 100, 2) AS lost_is_budget_pct,
    ROUND(AVG(f.search_lost_is_rank) * 100, 2) AS lost_is_rank_pct
FROM fact_performance f
JOIN dim_brands b ON f.brand_id = b.brand_id
JOIN dim_campaigns c ON f.campaign_id = c.campaign_id
GROUP BY f.data_date, b.brand_name, c.campaign_name, c.status, c.daily_budget_micros;

-- Ad Group-level daily summary (for bid optimization)
CREATE OR REPLACE VIEW v_ad_group_daily AS
SELECT
    f.data_date,
    b.brand_name,
    c.campaign_name,
    ag.ad_group_name,
    ag.status AS ad_group_status,
    ROUND(ag.cpc_bid_micros / 1000000.0, 2) AS current_cpc_bid,
    SUM(f.impressions) AS impressions,
    SUM(f.clicks) AS clicks,
    ROUND(SUM(f.cost_micros) / 1000000.0, 2) AS spend,
    SUM(f.conversions) AS conversions,
    -- Calculated
    ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.clicks), 0), 2) AS actual_cpc,
    ROUND(SUM(f.conversions) / NULLIF(SUM(f.clicks), 0) * 100, 2) AS conv_rate,
    ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.conversions), 0), 2) AS cost_per_conv,
    -- Competitive
    ROUND(AVG(f.search_impression_share) * 100, 2) AS search_is_pct,
    ROUND(AVG(f.search_lost_is_budget) * 100, 2) AS lost_is_budget_pct,
    ROUND(AVG(f.search_lost_is_rank) * 100, 2) AS lost_is_rank_pct
FROM fact_performance f
JOIN dim_brands b ON f.brand_id = b.brand_id
JOIN dim_campaigns c ON f.campaign_id = c.campaign_id
JOIN dim_ad_groups ag ON f.ad_group_id = ag.ad_group_id
GROUP BY f.data_date, b.brand_name, c.campaign_name, ag.ad_group_name, ag.status, ag.cpc_bid_micros;

-- Brand-level summary (for dashboard KPIs)
CREATE OR REPLACE VIEW v_brand_summary AS
SELECT
    b.brand_name,
    b.customer_id,
    COUNT(DISTINCT c.campaign_id) AS active_campaigns,
    COUNT(DISTINCT ag.ad_group_id) AS active_ad_groups,
    MIN(f.data_date) AS earliest_data,
    MAX(f.data_date) AS latest_data,
    SUM(f.impressions) AS total_impressions,
    SUM(f.clicks) AS total_clicks,
    ROUND(SUM(f.cost_micros) / 1000000.0, 2) AS total_spend,
    SUM(f.conversions) AS total_conversions
FROM dim_brands b
LEFT JOIN dim_campaigns c ON b.brand_id = c.brand_id
LEFT JOIN dim_ad_groups ag ON c.campaign_id = ag.campaign_id
LEFT JOIN fact_performance f ON b.brand_id = f.brand_id
WHERE b.is_mcc = FALSE
GROUP BY b.brand_name, b.customer_id;

-- Recent mutations (audit trail)
CREATE OR REPLACE VIEW v_recent_mutations AS
SELECT
    m.requested_at,
    m.entity_type,
    COALESCE(c.campaign_name, ag.ad_group_name) AS entity_name,
    b.brand_name,
    m.action,
    m.field_changed,
    m.old_value,
    m.new_value,
    m.execution_status,
    m.triggered_by
FROM enzo_mutations m
LEFT JOIN dim_campaigns c ON m.entity_type = 'campaign' AND m.entity_id = c.campaign_id
LEFT JOIN dim_ad_groups ag ON m.entity_type = 'ad_group' AND m.entity_id = ag.ad_group_id
LEFT JOIN dim_brands b ON m.customer_id = b.customer_id
ORDER BY m.requested_at DESC
LIMIT 100;

-- ============================================
-- FUNCTIONS: SQL Aggregations for 3Nzo
-- ============================================

-- Get spend summary for a date range
CREATE OR REPLACE FUNCTION get_spend_summary(
    p_start_date DATE,
    p_end_date DATE,
    p_brand_name VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    brand_name VARCHAR,
    spend NUMERIC,
    impressions BIGINT,
    clicks BIGINT,
    conversions NUMERIC,
    ctr NUMERIC,
    cpc NUMERIC,
    conv_rate NUMERIC,
    search_is_pct NUMERIC,
    lost_is_budget_pct NUMERIC,
    lost_is_rank_pct NUMERIC
) AS $$
BEGIN
    RETURN QUERY
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
    WHERE f.data_date BETWEEN p_start_date AND p_end_date
      AND (p_brand_name IS NULL OR b.brand_name ILIKE '%' || p_brand_name || '%')
      AND b.is_mcc = FALSE
    GROUP BY b.brand_name
    ORDER BY spend DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE dim_brands IS 'Brand/Account dimension - master list of Google Ads accounts';
COMMENT ON TABLE dim_campaigns IS 'Campaign dimension with mutable state (status, budget)';
COMMENT ON TABLE dim_ad_groups IS 'Ad Group dimension with mutable state (status, bids)';
COMMENT ON TABLE fact_performance IS 'Daily performance metrics including competitive metrics';
COMMENT ON TABLE enzo_mutations IS 'Audit log of all 3nzo actions and state changes';
