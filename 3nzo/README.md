# 3nzo — Paid Media AI Command Center

3nzo is a Next.js application that provides a dashboard and AI chat interface for managing paid media campaigns across Google Ads and Meta Ads.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend + API)                      │
├──────────────────────────────────────────────────────────────────┤
│  /dashboard        → KPIs, charts, spend overview                │
│  /chat             → 3Nzo AI chat interface                      │
│  /campaigns        → Campaign & ad group management              │
│                                                                  │
│  API Routes:                                                     │
│  /api/chat         → AI reasoning (GPT-4o → Claude)              │
│  /api/query        → SQL to Neon                                 │
│  /api/mutate       → Composio execution + write-through          │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      Neon       │     │    Composio     │     │   OpenAI/Claude │
│  (Star Schema)  │     │  (Google/Meta)  │     │   (Reasoning)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         ▲
         │ Daily sync
┌────────┴────────┐
│   NAS (ETL)     │
│   ingest.js     │
└─────────────────┘
```

## Features

- **Dashboard** — Real-time KPIs, spend trends, competitive metrics
- **AI Chat** — Natural language interface for queries and mutations
- **Campaign Management** — Pause/enable campaigns, adjust budgets
- **Ad Group Control** — Bid adjustments with historical context
- **Mutation Logging** — Audit trail of all 3nzo actions
- **Competitive Metrics** — Search IS, Lost IS (Budget/Rank)

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide icons, Recharts
- **Database**: Neon PostgreSQL (serverless)
- **AI**: Vercel AI SDK (OpenAI/Anthropic)
- **API Execution**: Composio SDK
- **Hosting**: Vercel

## Getting Started

### 1. Clone and Install

```bash
cd 3nzo
npm install
```

### 2. Set Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEON_DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
COMPOSIO_API_KEY=ak_...
```

### 3. Initialize Database

Run the schema in Neon:

```bash
psql $NEON_DATABASE_URL -f schema/neon-star-schema.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
vercel
```

## Database Schema

### Dimension Tables (Mutable State)

- `dim_brands` — Brand/account master
- `dim_campaigns` — Campaign details + status + budget
- `dim_ad_groups` — Ad group details + bids

### Fact Table

- `fact_performance` — Daily metrics including competitive metrics

### Audit Log

- `enzo_mutations` — All 3Nzo actions with before/after state

## Switching AI Providers

To switch from GPT-4o to Claude:

```typescript
// lib/ai.ts

// Before (OpenAI)
import { openai } from "@ai-sdk/openai";
export const aiModel = openai("gpt-4o");

// After (Claude)
import { anthropic } from "@ai-sdk/anthropic";
export const aiModel = anthropic("claude-sonnet-4-20250514");
```

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Teal | `#2A9D8F` | Primary |
| Navy | `#1D3557` | Secondary |
| Orange | `#E76F51` | Accent |
| Lime | `#7CB518` | Success |
| Sky | `#5DADE2` | Info |

---

Built for Geeko Digital Media
