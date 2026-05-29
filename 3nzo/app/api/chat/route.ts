import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { aiModel, systemPrompt } from "@/lib/ai";
import { querySpendSummary, queryCampaigns } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content || "";

    // Simple intent detection for now - will enhance with proper tool calling
    let contextData = "";

    // Check if user is asking about spend/performance
    if (
      userMessage.toLowerCase().includes("spend") ||
      userMessage.toLowerCase().includes("cost") ||
      userMessage.toLowerCase().includes("performance")
    ) {
      try {
        // Get last 7 days of spend data
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const startDate = weekAgo.toISOString().split("T")[0];
        const endDate = today.toISOString().split("T")[0];

        const spendData = await querySpendSummary(startDate, endDate);

        if (spendData.length > 0) {
          contextData = `\n\n**Recent Performance Data (Last 7 Days):**\n`;
          contextData += `| Brand | Spend | Clicks | Conversions | CTR | CPC |\n`;
          contextData += `|-------|-------|--------|-------------|-----|-----|\n`;

          for (const row of spendData) {
            contextData += `| ${row.brand_name} | $${row.spend} | ${row.clicks} | ${row.conversions} | ${row.ctr}% | $${row.cpc} |\n`;
          }
        }
      } catch (dbError) {
        console.error("Database query error:", dbError);
        contextData = "\n\n*Note: Could not fetch live data. Using cached response.*";
      }
    }

    // Check if user is asking about campaigns
    if (
      userMessage.toLowerCase().includes("campaign") ||
      userMessage.toLowerCase().includes("status") ||
      userMessage.toLowerCase().includes("pause")
    ) {
      try {
        const campaigns = await queryCampaigns();

        if (campaigns.length > 0) {
          contextData += `\n\n**Campaign Status:**\n`;
          contextData += `| Brand | Campaign | Status | Daily Budget |\n`;
          contextData += `|-------|----------|--------|-------------|\n`;

          for (const row of campaigns.slice(0, 10)) {
            contextData += `| ${row.brand_name} | ${row.campaign_name?.substring(0, 30)}... | ${row.status} | $${row.daily_budget || "N/A"} |\n`;
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
