import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { aiModel, systemPrompt } from "@/lib/ai";
import { getDb } from "@/lib/db";

async function getTopCampaigns(brandFilter?: string) {
  const sql = getDb();
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const startDate = weekAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  const result = await sql`
    SELECT
      b.brand_name,
      c.campaign_name,
      SUM(f.impressions) as impressions,
      SUM(f.clicks) as clicks,
      ROUND(SUM(f.cost_micros) / 1000000.0, 2) as cost,
      ROUND(SUM(f.conversions), 2) as conversions,
      ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.conversions), 0), 2) as cost_per_conversion
    FROM fact_performance f
    JOIN dim_brands b ON f.brand_id = b.brand_id
    JOIN dim_campaigns c ON f.campaign_id = c.campaign_id
    WHERE f.data_date BETWEEN ${startDate}::date AND ${endDate}::date
      AND b.is_mcc = FALSE
      ${brandFilter ? sql`AND b.brand_name ILIKE ${'%' + brandFilter + '%'}` : sql``}
    GROUP BY b.brand_name, c.campaign_name
    ORDER BY conversions DESC
    LIMIT 10
  `;

  return result;
}

async function getBrandSpend(brandFilter?: string) {
  const sql = getDb();
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const startDate = weekAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  const result = await sql`
    SELECT
      b.brand_name,
      ROUND(SUM(f.cost_micros) / 1000000.0, 2) as spend,
      SUM(f.impressions) as impressions,
      SUM(f.clicks) as clicks,
      ROUND(SUM(f.conversions), 2) as conversions,
      ROUND(SUM(f.clicks) * 100.0 / NULLIF(SUM(f.impressions), 0), 2) as ctr,
      ROUND(SUM(f.cost_micros) / 1000000.0 / NULLIF(SUM(f.clicks), 0), 2) as cpc,
      ROUND(AVG(f.search_impression_share) * 100, 2) as search_is
    FROM fact_performance f
    JOIN dim_brands b ON f.brand_id = b.brand_id
    WHERE f.data_date BETWEEN ${startDate}::date AND ${endDate}::date
      AND b.is_mcc = FALSE
      ${brandFilter ? sql`AND b.brand_name ILIKE ${'%' + brandFilter + '%'}` : sql``}
    GROUP BY b.brand_name
    ORDER BY spend DESC
  `;

  return result;
}

async function getCampaignsList(brandFilter?: string) {
  const sql = getDb();

  const result = await sql`
    SELECT
      b.brand_name,
      c.campaign_name,
      c.status,
      ROUND(c.daily_budget_micros / 1000000.0, 2) as daily_budget
    FROM dim_campaigns c
    JOIN dim_brands b ON c.brand_id = b.brand_id
    WHERE b.is_mcc = FALSE
      ${brandFilter ? sql`AND b.brand_name ILIKE ${'%' + brandFilter + '%'}` : sql``}
    ORDER BY b.brand_name, c.campaign_name
    LIMIT 20
  `;

  return result;
}

function extractBrandFromMessage(message: string): string | undefined {
  const brands = ["radiant waxing", "paused studio", "amazing lash", "drybar", "the joint"];
  const lowerMsg = message.toLowerCase();

  for (const brand of brands) {
    if (lowerMsg.includes(brand)) {
      return brand;
    }
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const userMessage = messages[messages.length - 1]?.content || "";
    const lowerMessage = userMessage.toLowerCase();

    let contextData = "";
    const brandFilter = extractBrandFromMessage(userMessage);

    // Top performing / best campaigns
    if (
      lowerMessage.includes("top") ||
      lowerMessage.includes("best") ||
      lowerMessage.includes("performing") ||
      lowerMessage.includes("performance")
    ) {
      try {
        const campaigns = await getTopCampaigns(brandFilter);

        if (campaigns.length > 0) {
          contextData = `\n\n**Top Performing Campaigns (Last 7 Days):**\n`;
          contextData += `| Campaign | Brand | Impressions | Clicks | Conversions | Cost | Cost/Conv |\n`;
          contextData += `|----------|-------|-------------|--------|-------------|------|----------|\n`;

          for (const row of campaigns) {
            const costPerConv = row.cost_per_conversion ? `$${row.cost_per_conversion}` : "N/A";
            contextData += `| ${row.campaign_name} | ${row.brand_name} | ${Number(row.impressions).toLocaleString()} | ${row.clicks} | ${row.conversions} | $${row.cost} | ${costPerConv} |\n`;
          }
        }
      } catch (dbError) {
        console.error("Database query error:", dbError);
      }
    }

    // Spend queries
    else if (
      lowerMessage.includes("spend") ||
      lowerMessage.includes("cost") ||
      lowerMessage.includes("how much")
    ) {
      try {
        const spendData = await getBrandSpend(brandFilter);

        if (spendData.length > 0) {
          contextData = `\n\n**Spend Summary (Last 7 Days):**\n`;
          contextData += `| Brand | Spend | Impressions | Clicks | Conversions | CTR | CPC | Search IS |\n`;
          contextData += `|-------|-------|-------------|--------|-------------|-----|-----|----------|\n`;

          for (const row of spendData) {
            contextData += `| ${row.brand_name} | $${row.spend} | ${Number(row.impressions).toLocaleString()} | ${row.clicks} | ${row.conversions} | ${row.ctr}% | $${row.cpc} | ${row.search_is}% |\n`;
          }
        }
      } catch (dbError) {
        console.error("Database query error:", dbError);
      }
    }

    // Campaign list / status
    else if (
      lowerMessage.includes("campaign") ||
      lowerMessage.includes("status") ||
      lowerMessage.includes("pause") ||
      lowerMessage.includes("list")
    ) {
      try {
        const campaigns = await getCampaignsList(brandFilter);

        if (campaigns.length > 0) {
          contextData = `\n\n**Campaign List:**\n`;
          contextData += `| Campaign | Brand | Status | Daily Budget |\n`;
          contextData += `|----------|-------|--------|-------------|\n`;

          for (const row of campaigns) {
            const budget = row.daily_budget ? `$${row.daily_budget}` : "N/A";
            contextData += `| ${row.campaign_name} | ${row.brand_name} | ${row.status} | ${budget} |\n`;
          }
        }
      } catch (dbError) {
        console.error("Database query error:", dbError);
      }
    }

    // Search Impression Share
    else if (
      lowerMessage.includes("impression share") ||
      lowerMessage.includes("search is") ||
      lowerMessage.includes("competitive")
    ) {
      try {
        const spendData = await getBrandSpend(brandFilter);

        if (spendData.length > 0) {
          contextData = `\n\n**Competitive Metrics (Last 7 Days):**\n`;
          contextData += `| Brand | Search IS | Spend | Impressions |\n`;
          contextData += `|-------|-----------|-------|-------------|\n`;

          for (const row of spendData) {
            contextData += `| ${row.brand_name} | ${row.search_is}% | $${row.spend} | ${Number(row.impressions).toLocaleString()} |\n`;
          }
        }
      } catch (dbError) {
        console.error("Database query error:", dbError);
      }
    }

    // Generate response with AI
    const { text } = await generateText({
      model: aiModel,
      system: systemPrompt + contextData,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
