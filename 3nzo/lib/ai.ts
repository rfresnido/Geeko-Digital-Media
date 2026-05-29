import { openai } from "@ai-sdk/openai";
// import { anthropic } from "@ai-sdk/anthropic"; // Uncomment when switching to Claude

// Current AI provider - easy to switch
export const aiModel = openai("gpt-4o");

// When ready to switch to Claude, just change these 2 lines:
// import { anthropic } from "@ai-sdk/anthropic";
// export const aiModel = anthropic("claude-sonnet-4-20250514");

// System prompt with schema knowledge
export const systemPrompt = `You are 3Nzo, an AI assistant for Geeko Digital Media's paid media operations.

## Your Capabilities
1. Query performance data (impressions, clicks, spend, conversions)
2. Query competitive metrics (Search IS, Lost IS due to Budget/Rank)
3. Execute mutations (pause campaigns, change budgets, adjust bids)
4. Provide insights and recommendations

## Database Schema
You have access to these tables in PostgreSQL:

### dim_brands
- brand_name, customer_id, is_mcc

### dim_campaigns
- campaign_name, status (ENABLED/PAUSED), daily_budget_micros

### dim_ad_groups
- ad_group_name, status, cpc_bid_micros

### fact_performance
- data_date, impressions, clicks, cost_micros, conversions
- search_impression_share, search_lost_is_budget, search_lost_is_rank

## Brands You Manage
- Radiant Waxing (7008801468)
- Paused Studio (9456534996)
- Amazing Lash Studio (5184398848)
- Drybar (5692576556)
- The Joint Chiropractic (4805941762) - MCC with 109 locations

## Important Notes
- cost_micros: Divide by 1,000,000 to get USD
- Competitive metrics are decimals (0.85 = 85%)
- Always confirm before executing mutations
- MCC accounts (is_mcc = true) don't have direct metrics

## Response Style
- Be concise and data-driven
- Use tables for multi-row data
- Highlight actionable insights
- Ask for confirmation before mutations
`;

// Tool definitions for function calling
export const tools = {
  querySpend: {
    description: "Query spend and performance metrics for a date range",
    parameters: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
        endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
        brandName: { type: "string", description: "Optional brand filter" },
      },
      required: ["startDate", "endDate"],
    },
  },
  queryCampaigns: {
    description: "Get list of campaigns with status and budgets",
    parameters: {
      type: "object",
      properties: {
        brandName: { type: "string", description: "Optional brand filter" },
      },
    },
  },
  queryAdGroups: {
    description: "Get list of ad groups with bids and status",
    parameters: {
      type: "object",
      properties: {
        campaignId: { type: "number", description: "Optional campaign filter" },
      },
    },
  },
  pauseCampaign: {
    description: "Pause a campaign (requires confirmation)",
    parameters: {
      type: "object",
      properties: {
        campaignId: { type: "number", description: "Campaign ID to pause" },
        reason: { type: "string", description: "Reason for pausing" },
      },
      required: ["campaignId"],
    },
  },
  enableCampaign: {
    description: "Enable a paused campaign",
    parameters: {
      type: "object",
      properties: {
        campaignId: { type: "number", description: "Campaign ID to enable" },
      },
      required: ["campaignId"],
    },
  },
  setBudget: {
    description: "Set daily budget for a campaign",
    parameters: {
      type: "object",
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        budgetUsd: { type: "number", description: "New daily budget in USD" },
      },
      required: ["campaignId", "budgetUsd"],
    },
  },
  setAdGroupBid: {
    description: "Set CPC bid for an ad group",
    parameters: {
      type: "object",
      properties: {
        adGroupId: { type: "number", description: "Ad Group ID" },
        bidUsd: { type: "number", description: "New CPC bid in USD" },
      },
      required: ["adGroupId", "bidUsd"],
    },
  },
};
