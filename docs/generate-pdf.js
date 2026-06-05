const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
const outputPath = './google-ads-api-design-documentation.pdf';

doc.pipe(fs.createWriteStream(outputPath));

// Title
doc.fontSize(24).font('Helvetica-Bold')
   .text('Google Ads API Design Documentation', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).font('Helvetica')
   .text('Application for Developer Token — Basic Access', { align: 'center' });
doc.moveDown(1);

// Horizontal line
doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(1);

// Company Name
doc.fontSize(16).font('Helvetica-Bold').text('Company Name');
doc.fontSize(11).font('Helvetica').text('Geeko Digital Media');
doc.moveDown(1);

// Business Model
doc.fontSize(16).font('Helvetica-Bold').text('Business Model');
doc.fontSize(11).font('Helvetica')
   .text('Geeko Digital Media is a digital marketing agency specializing in paid media management for franchise and multi-location businesses. We manage Google Ads accounts for several clients including:', { lineGap: 4 });
doc.moveDown(0.5);
doc.text('• Radiant Waxing (Customer ID: 700-880-1468)', { indent: 20 });
doc.text('• Amazing Lash Studio (Customer ID: 518-439-8848)', { indent: 20 });
doc.text('• Drybar (Customer ID: 569-257-6556)', { indent: 20 });
doc.text('• The Joint Chiropractic (Customer ID: 480-594-1762) — MCC with 109 franchise locations', { indent: 20 });
doc.text('• Paused Studio (Customer ID: 945-653-4996)', { indent: 20 });
doc.moveDown(0.5);
doc.text('All accounts are owned by our clients and managed under our agency\'s MCC (Manager Account). We only manage Google Ads for contracted clients and do not resell API access to third parties.');
doc.moveDown(1);

// Tool Name
doc.fontSize(16).font('Helvetica-Bold').text('Tool Name');
doc.fontSize(11).font('Helvetica-Bold').text('3nzo', { continued: true });
doc.font('Helvetica').text(' — AI-Powered Paid Media Command Center');
doc.moveDown(1);

// Tool Access/Use
doc.fontSize(16).font('Helvetica-Bold').text('Tool Access/Use');
doc.fontSize(11).font('Helvetica')
   .text('3nzo is an internal agency tool used exclusively by Geeko Digital Media employees to:', { lineGap: 4 });
doc.moveDown(0.5);
doc.font('Helvetica-Bold').text('1. View Performance Data', { continued: true, indent: 20 });
doc.font('Helvetica').text(' — Unified dashboard displaying metrics across all managed accounts including impressions, clicks, conversions, spend, CTR, CPC, CPA, and Search Impression Share.');
doc.moveDown(0.3);
doc.font('Helvetica-Bold').text('2. Generate Reports', { continued: true, indent: 20 });
doc.font('Helvetica').text(' — Visual reports with date range selection, filterable by account, campaign status, and campaign name. Reports can be exported for client presentations.');
doc.moveDown(0.3);
doc.font('Helvetica-Bold').text('3. AI-Assisted Queries', { continued: true, indent: 20 });
doc.font('Helvetica').text(' — Natural language chat interface allowing team members to ask questions like "What\'s Radiant Waxing\'s spend this week?" or "Show top performing campaigns."');
doc.moveDown(0.3);
doc.font('Helvetica-Bold').text('4. Campaign Management', { continued: true, indent: 20 });
doc.font('Helvetica').text(' — Ability to pause/enable campaigns, adjust daily budgets, and modify bids directly from the tool (with confirmation flows to prevent accidental changes).');
doc.moveDown(0.3);
doc.font('Helvetica-Bold').text('5. Automated Monitoring', { continued: true, indent: 20 });
doc.font('Helvetica').text(' — Daily sync of performance data at 6:30 AM to maintain up-to-date reporting.');
doc.moveDown(0.5);

doc.font('Helvetica-Bold').text('Access Control:');
doc.font('Helvetica')
   .text('• Only authenticated Geeko Digital Media employees can access the tool', { indent: 20 })
   .text('• The tool is hosted at https://3nzo.geekodmedia.com (internal access only)', { indent: 20 })
   .text('• Clients do not have direct access to the tool; they receive exported reports', { indent: 20 });
doc.moveDown(1);

// New page for Tool Design
doc.addPage();

// Tool Design
doc.fontSize(16).font('Helvetica-Bold').text('Tool Design');
doc.moveDown(0.5);

doc.fontSize(14).font('Helvetica-Bold').text('Architecture');
doc.fontSize(9).font('Courier')
   .text('┌─────────────────────────────────────────────────────────────────┐')
   .text('│                         3nzo Web App                            │')
   .text('│                    (Next.js on Vercel)                          │')
   .text('├─────────────────────────────────────────────────────────────────┤')
   .text('│  Dashboard UI  │  AI Chat  │  Campaign Manager  │  Settings    │')
   .text('└───────┬────────┴─────┬─────┴────────┬───────────┴──────┬───────┘')
   .text('        │              │              │                  │')
   .text('        ▼              ▼              ▼                  ▼')
   .text('┌─────────────────────────────────────────────────────────────────┐')
   .text('│                      API Layer (Next.js)                        │')
   .text('├─────────────────────────────────────────────────────────────────┤')
   .text('│  /api/dashboard  │  /api/chat  │  /api/campaigns  │  /api/...  │')
   .text('└───────┬──────────┴──────┬──────┴────────┬────────┴─────────────┘')
   .text('        │                 │               │')
   .text('        ▼                 ▼               ▼')
   .text('┌──────────────────┐  ┌──────────────────────────────────────────┐')
   .text('│  Neon PostgreSQL │  │           Google Ads API                 │')
   .text('│  (Read Replica)  │  │  - GoogleAdsService (reporting)          │')
   .text('│                  │  │  - CampaignService (mutations)           │')
   .text('│  - dim_brands    │  │  - AdGroupService (bid adjustments)      │')
   .text('│  - dim_campaigns │  │  - CustomerService (account info)        │')
   .text('│  - fact_perf     │  │                                          │')
   .text('└──────────────────┘  └──────────────────────────────────────────┘');
doc.moveDown(1);

doc.fontSize(14).font('Helvetica-Bold').text('Data Flow');
doc.moveDown(0.3);
doc.fontSize(11).font('Helvetica-Bold').text('Reading Data (Reporting):');
doc.font('Helvetica')
   .text('1. Daily scheduled job pulls metrics from Google Ads API using GoogleAdsService', { indent: 20 })
   .text('2. Data is transformed and stored in Neon PostgreSQL (star schema)', { indent: 20 })
   .text('3. Dashboard UI queries the database to display performance metrics', { indent: 20 })
   .text('4. AI chat queries the database to answer natural language questions', { indent: 20 });
doc.moveDown(0.5);
doc.font('Helvetica-Bold').text('Writing Data (Mutations):');
doc.font('Helvetica')
   .text('1. User initiates action in UI (e.g., "Pause Campaign X")', { indent: 20 })
   .text('2. Confirmation dialog shows details and requires explicit approval', { indent: 20 })
   .text('3. API call is made to Google Ads API (CampaignService, AdGroupService)', { indent: 20 })
   .text('4. Mutation is logged in our database for audit trail', { indent: 20 })
   .text('5. UI reflects the change after confirmation from API', { indent: 20 });
doc.moveDown(1);

// API Services Called
doc.fontSize(16).font('Helvetica-Bold').text('API Services Called');
doc.moveDown(0.5);

doc.fontSize(14).font('Helvetica-Bold').text('Read Operations (Reporting)');
doc.moveDown(0.3);

// Table header
doc.fontSize(10).font('Helvetica-Bold');
doc.text('Service', 50, doc.y, { width: 150, continued: true });
doc.text('Resource', 200, doc.y, { width: 150, continued: true });
doc.text('Purpose', 350, doc.y, { width: 200 });
doc.moveDown(0.3);
doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(0.3);

doc.fontSize(10).font('Helvetica');
const readOps = [
  ['GoogleAdsService', 'customer', 'Pull account-level performance metrics'],
  ['GoogleAdsService', 'campaign', 'Pull campaign-level metrics and status'],
  ['GoogleAdsService', 'ad_group', 'Pull ad group-level metrics and bids'],
  ['GoogleAdsService', 'search_term_view', 'Analyze search query performance'],
  ['CustomerService', 'customer', 'Retrieve account hierarchy for MCC'],
];

readOps.forEach(row => {
  doc.text(row[0], 50, doc.y, { width: 150, continued: true });
  doc.text(row[1], 200, doc.y, { width: 150, continued: true });
  doc.text(row[2], 350, doc.y, { width: 200 });
});
doc.moveDown(1);

doc.fontSize(14).font('Helvetica-Bold').text('Write Operations (Mutations)');
doc.moveDown(0.3);

doc.fontSize(10).font('Helvetica-Bold');
doc.text('Service', 50, doc.y, { width: 150, continued: true });
doc.text('Operation', 200, doc.y, { width: 150, continued: true });
doc.text('Purpose', 350, doc.y, { width: 200 });
doc.moveDown(0.3);
doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(0.3);

doc.fontSize(10).font('Helvetica');
const writeOps = [
  ['CampaignService', 'MutateCampaigns', 'Pause/enable campaigns'],
  ['CampaignBudgetService', 'MutateCampaignBudgets', 'Adjust daily budgets'],
  ['AdGroupService', 'MutateAdGroups', 'Modify ad group bids and status'],
];

writeOps.forEach(row => {
  doc.text(row[0], 50, doc.y, { width: 150, continued: true });
  doc.text(row[1], 200, doc.y, { width: 150, continued: true });
  doc.text(row[2], 350, doc.y, { width: 200 });
});
doc.moveDown(1);

// New page for GAQL and Security
doc.addPage();

// GAQL Queries
doc.fontSize(16).font('Helvetica-Bold').text('GAQL Queries Used');
doc.moveDown(0.5);

doc.fontSize(12).font('Helvetica-Bold').text('Account Performance:');
doc.fontSize(9).font('Courier')
   .text('SELECT')
   .text('  segments.date,')
   .text('  metrics.impressions,')
   .text('  metrics.clicks,')
   .text('  metrics.cost_micros,')
   .text('  metrics.conversions,')
   .text('  metrics.search_impression_share,')
   .text('  metrics.search_budget_lost_impression_share,')
   .text('  metrics.search_rank_lost_impression_share')
   .text('FROM customer')
   .text('WHERE segments.date DURING LAST_30_DAYS');
doc.moveDown(1);

doc.fontSize(12).font('Helvetica-Bold').text('Campaign Performance:');
doc.fontSize(9).font('Courier')
   .text('SELECT')
   .text('  campaign.id,')
   .text('  campaign.name,')
   .text('  campaign.status,')
   .text('  campaign_budget.amount_micros,')
   .text('  metrics.impressions,')
   .text('  metrics.clicks,')
   .text('  metrics.cost_micros,')
   .text('  metrics.conversions')
   .text('FROM campaign')
   .text('WHERE segments.date DURING LAST_7_DAYS')
   .text("  AND campaign.status != 'REMOVED'");
doc.moveDown(1);

// Security
doc.fontSize(16).font('Helvetica-Bold').text('Security & Compliance');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica');

const securityItems = [
  ['OAuth 2.0', 'All API access uses OAuth 2.0 with refresh tokens stored securely in environment variables'],
  ['Principle of Least Privilege', 'We only request scopes necessary for our operations'],
  ['Audit Logging', 'All mutations are logged with timestamp, user, and before/after values'],
  ['Confirmation Flows', 'Destructive actions require explicit user confirmation'],
  ['Rate Limiting', 'We respect API quotas and implement exponential backoff'],
  ['Data Retention', 'Performance data is retained for reporting; no PII is stored'],
];

securityItems.forEach((item, i) => {
  doc.font('Helvetica-Bold').text(`${i + 1}. ${item[0]}`, { continued: true });
  doc.font('Helvetica').text(` — ${item[1]}`);
  doc.moveDown(0.3);
});
doc.moveDown(1);

// Tool Screenshots section
doc.fontSize(16).font('Helvetica-Bold').text('Tool Screenshots');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica-Oblique')
   .text('Screenshots are included as separate attachments:');
doc.moveDown(0.3);
doc.font('Helvetica')
   .text('• dashboard.png — Account Overview with KPIs and brand performance table', { indent: 20 })
   .text('• campaigns.png — Expanded brand row showing individual campaigns', { indent: 20 })
   .text('• chat.png — AI Chat interface with natural language query', { indent: 20 })
   .text('• filters.png — Google Ads-style filters for accounts and campaigns', { indent: 20 });
doc.moveDown(1);

// Contact Information
doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(1);

doc.fontSize(16).font('Helvetica-Bold').text('Contact Information');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica');
doc.font('Helvetica-Bold').text('Company: ', { continued: true });
doc.font('Helvetica').text('Geeko Digital Media');
doc.font('Helvetica-Bold').text('Contact: ', { continued: true });
doc.font('Helvetica').text('RJ Fresnido');
doc.font('Helvetica-Bold').text('Email: ', { continued: true });
doc.font('Helvetica').text('rfresnido@geekodmedia.com');
doc.font('Helvetica-Bold').text('Website: ', { continued: true });
doc.font('Helvetica').text('https://geekodmedia.com');
doc.font('Helvetica-Bold').text('Tool URL: ', { continued: true });
doc.font('Helvetica').text('https://3nzo.geekodmedia.com (internal access only)');
doc.moveDown(1);

doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(0.5);
doc.fontSize(10).font('Helvetica-Oblique')
   .text('Document prepared for Google Ads API Developer Token application — Basic Access', { align: 'center' });

doc.end();

console.log(`PDF generated: ${outputPath}`);
