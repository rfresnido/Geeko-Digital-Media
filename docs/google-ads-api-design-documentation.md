# Google Ads API Design Documentation

**Application for Developer Token — Basic Access**

---

## Company Name
Geeko Digital Media

## Business Model
Geeko Digital Media is a digital marketing agency specializing in paid media management for franchise and multi-location businesses. 

**MCC:** Geeko Digital Media - MCC (Customer ID: 503-015-3115)

**Current Accounts Under Management:**
- **9 Dots - Ads Grant** (Customer ID: 921-382-6651) — Google Ad Grants nonprofit account
- **9 Dots** (Customer ID: 285-964-4846)
- **Geeko Digital Media** (Customer ID: 373-401-0058)

**Upcoming Client Accounts (OTT - Onboarding in Progress):**
- Radiant Waxing
- Amazing Lash Studio
- Drybar
- The Joint Chiropractic — MCC with 109 franchise locations
- Pause Studio

All accounts are owned by our clients and managed under our agency's MCC (Manager Account). We only manage Google Ads for contracted clients and do not resell API access to third parties.

## Tool Name
**3nzo** — AI-Powered Paid Media Command Center

## Tool Access/Use
3nzo is an **internal agency tool** used exclusively by Geeko Digital Media employees to:

1. **View Performance Data** — Unified dashboard displaying metrics across all managed accounts including impressions, clicks, conversions, spend, CTR, CPC, CPA, and Search Impression Share.

2. **Generate Reports** — Visual reports with date range selection, filterable by account, campaign status, and campaign name. Reports can be exported for client presentations.

3. **AI-Assisted Queries** — Natural language chat interface allowing team members to ask questions like "What's Radiant Waxing's spend this week?" or "Show top performing campaigns."

4. **Campaign Management** — Ability to pause/enable campaigns, adjust daily budgets, and modify bids directly from the tool (with confirmation flows to prevent accidental changes).

5. **Automated Monitoring** — Daily sync of performance data at 6:30 AM to maintain up-to-date reporting.

**Access Control:**
- Only authenticated Geeko Digital Media employees can access the tool
- The tool is hosted at https://3nzo.geekodmedia.com (internal access only)
- Clients do not have direct access to the tool; they receive exported reports

## Tool Design

### Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         3nzo Web App                            │
│                    (Next.js on Vercel)                          │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard UI  │  AI Chat  │  Campaign Manager  │  Settings    │
└───────┬────────┴─────┬─────┴────────┬───────────┴──────┬───────┘
        │              │              │                  │
        ▼              ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  /api/dashboard  │  /api/chat  │  /api/campaigns  │  /api/...  │
└───────┬──────────┴──────┬──────┴────────┬────────┴─────────────┘
        │                 │               │
        ▼                 ▼               ▼
┌──────────────────┐  ┌──────────────────────────────────────────┐
│  Neon PostgreSQL │  │           Google Ads API                 │
│  (Read Replica)  │  │  - GoogleAdsService (reporting)          │
│                  │  │  - CampaignService (mutations)           │
│  - dim_brands    │  │  - AdGroupService (bid adjustments)      │
│  - dim_campaigns │  │  - CustomerService (account info)        │
│  - fact_perf     │  │                                          │
└──────────────────┘  └──────────────────────────────────────────┘
```

### Data Flow

**Reading Data (Reporting):**
1. Daily scheduled job pulls metrics from Google Ads API using GoogleAdsService
2. Data is transformed and stored in Neon PostgreSQL (star schema)
3. Dashboard UI queries the database to display performance metrics
4. AI chat queries the database to answer natural language questions

**Writing Data (Mutations):**
1. User initiates action in UI (e.g., "Pause Campaign X")
2. Confirmation dialog shows details and requires explicit approval
3. API call is made to Google Ads API (CampaignService, AdGroupService)
4. Mutation is logged in our database for audit trail
5. UI reflects the change after confirmation from API

### Database Schema (Simplified)
```sql
-- Dimension Tables
dim_brands (brand_id, brand_name, customer_id, is_mcc)
dim_campaigns (campaign_id, brand_id, campaign_name, status, daily_budget_micros)
dim_ad_groups (ad_group_id, campaign_id, ad_group_name, status, cpc_bid_micros)

-- Fact Table
fact_performance (
  data_date, brand_id, campaign_id, ad_group_id,
  impressions, clicks, cost_micros, conversions,
  search_impression_share, search_lost_is_budget, search_lost_is_rank
)

-- Audit Table
mutation_log (
  mutation_id, timestamp, user_id, action_type,
  entity_type, entity_id, old_value, new_value, status
)
```

## API Services Called

### Read Operations (Reporting)
| Service | Resource | Purpose |
|---------|----------|---------|
| GoogleAdsService | `customer` | Pull account-level performance metrics |
| GoogleAdsService | `campaign` | Pull campaign-level metrics and status |
| GoogleAdsService | `ad_group` | Pull ad group-level metrics and bids |
| GoogleAdsService | `search_term_view` | Analyze search query performance |
| CustomerService | `customer` | Retrieve account hierarchy for MCC |

### Write Operations (Mutations)
| Service | Operation | Purpose |
|---------|-----------|---------|
| CampaignService | `MutateCampaigns` | Pause/enable campaigns |
| CampaignBudgetService | `MutateCampaignBudgets` | Adjust daily budgets |
| AdGroupService | `MutateAdGroups` | Modify ad group bids and status |

### GAQL Queries Used

**Account Performance:**
```sql
SELECT
  segments.date,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.search_impression_share,
  metrics.search_budget_lost_impression_share,
  metrics.search_rank_lost_impression_share
FROM customer
WHERE segments.date DURING LAST_30_DAYS
```

**Campaign Performance:**
```sql
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  campaign_budget.amount_micros,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions
FROM campaign
WHERE segments.date DURING LAST_7_DAYS
  AND campaign.status != 'REMOVED'
```

## Security & Compliance

1. **OAuth 2.0** — All API access uses OAuth 2.0 with refresh tokens stored securely in environment variables

2. **Principle of Least Privilege** — We only request scopes necessary for our operations

3. **Audit Logging** — All mutations are logged with timestamp, user, and before/after values

4. **Confirmation Flows** — Destructive actions require explicit user confirmation

5. **Rate Limiting** — We respect API quotas and implement exponential backoff

6. **Data Retention** — Performance data is retained for reporting; no PII is stored

## Tool Screenshots

### Dashboard — Account Overview
*Shows KPIs (Spend, Impressions, Clicks, Conversions) with period-over-period comparison, competitive metrics (Search IS), and filterable brand performance table.*

![Dashboard Screenshot](screenshots/dashboard.png)

### Dashboard — Campaign Drill-Down
*Expandable brand rows showing individual campaigns with status, daily budget, and performance metrics.*

![Campaign Drill-Down](screenshots/campaigns.png)

### AI Chat Interface
*Natural language interface for querying performance data. Example: "How much did Radiant Waxing spend this week?"*

![Chat Interface](screenshots/chat.png)

### Filters & Date Range
*Google Ads-style filters for account, campaign status, campaign name (contains), and custom date ranges.*

![Filters](screenshots/filters.png)

### Campaign Management (Planned)
*Interface for pausing campaigns, adjusting budgets, and modifying bids with confirmation dialogs.*

![Campaign Management](screenshots/campaign-management-mockup.png)

---

## Contact Information

**Company:** Geeko Digital Media  
**Contact:** [Your Name]  
**Email:** [your-email@geekodmedia.com]  
**Website:** https://geekodmedia.com  
**Tool URL:** https://3nzo.geekodmedia.com (internal access only)

---

*Document prepared for Google Ads API Developer Token application — Basic Access*
