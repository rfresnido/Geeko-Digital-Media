const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  margin: 50,
  size: 'A4',
  bufferPages: true
});
const outputPath = './google-ads-api-design-documentation.pdf';

doc.pipe(fs.createWriteStream(outputPath));

// Colors
const navy = '#1e3a5f';
const teal = '#0d9488';
const gray = '#64748b';
const darkGray = '#334155';

// ===================== PAGE 1 =====================
// Title
doc.fontSize(24).font('Helvetica-Bold').fillColor(navy)
   .text('Google Ads API Design Documentation', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(12).font('Helvetica').fillColor(gray)
   .text('Application for Developer Token — Basic Access', { align: 'center' });
doc.moveDown(0.3);

doc.strokeColor(teal).lineWidth(2);
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
doc.moveDown(1);

// Company Name
doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('Company Name');
doc.fontSize(11).font('Helvetica').fillColor(darkGray).text('Geeko Digital Media');
doc.moveDown(0.8);

// Business Model
doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('Business Model');
doc.fontSize(11).font('Helvetica').fillColor(darkGray)
   .text('Geeko Digital Media is a digital marketing agency specializing in paid media management for franchise and multi-location businesses.');
doc.moveDown(0.5);

doc.font('Helvetica-Bold').fillColor(teal).text('MCC: ', { continued: true });
doc.font('Helvetica').fillColor(darkGray).text('Geeko Digital Media - MCC (Customer ID: 503-015-3115)');
doc.moveDown(0.4);

doc.font('Helvetica-Bold').fillColor(navy).text('Current Accounts Under Management:');
doc.font('Helvetica').fillColor(darkGray);
doc.text('    • 9 Dots - Ads Grant (921-382-6651) — Google Ad Grants nonprofit');
doc.text('    • 9 Dots (285-964-4846)');
doc.text('    • Geeko Digital Media (373-401-0058)');
doc.moveDown(0.4);

doc.font('Helvetica-Bold').fillColor(navy).text('Upcoming Client Accounts (OTT - Onboarding):');
doc.font('Helvetica').fillColor(darkGray);
doc.text('    • Radiant Waxing');
doc.text('    • Amazing Lash Studio');
doc.text('    • Drybar');
doc.text('    • The Joint Chiropractic — MCC with 109 franchise locations');
doc.text('    • Pause Studio');
doc.moveDown(0.4);

doc.text('All accounts are owned by our clients and managed under our agency\'s MCC. We only manage Google Ads for contracted clients and do not resell API access.');
doc.moveDown(0.8);

// Tool Name
doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('Tool Name');
doc.fontSize(11).font('Helvetica-Bold').fillColor(teal).text('3nzo', { continued: true });
doc.font('Helvetica').fillColor(darkGray).text(' — AI-Powered Paid Media Command Center');
doc.moveDown(0.8);

// Tool Access/Use
doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('Tool Access/Use');
doc.fontSize(11).font('Helvetica').fillColor(darkGray)
   .text('3nzo is an internal agency tool used exclusively by Geeko Digital Media employees to:');
doc.moveDown(0.3);

const features = [
  ['1. View Performance Data', 'Unified dashboard with impressions, clicks, conversions, spend, CTR, CPC, CPA, Search IS'],
  ['2. Generate Reports', 'Visual reports with date range selection, filterable by account, campaign status, and name'],
  ['3. AI-Assisted Queries', 'Natural language chat interface for questions like "What\'s the spend this week?"'],
  ['4. Campaign Management', 'Pause/enable campaigns, adjust budgets, modify bids (with confirmation flows)'],
  ['5. Automated Monitoring', 'Daily sync of performance data at 6:30 AM'],
];

features.forEach(f => {
  doc.font('Helvetica-Bold').fillColor(teal).text(f[0], { continued: true });
  doc.font('Helvetica').fillColor(darkGray).text(' — ' + f[1]);
});
doc.moveDown(0.4);

doc.font('Helvetica-Bold').fillColor(navy).text('Access Control:');
doc.font('Helvetica').fillColor(darkGray);
doc.text('    • Only authenticated Geeko Digital Media employees can access the tool');
doc.text('    • Hosted at https://3nzo.geekodmedia.com (internal access only)');
doc.text('    • Clients receive exported reports but cannot access the tool directly');

// ===================== PAGE 2 =====================
doc.addPage();

doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('Tool Design');
doc.moveDown(0.5);

doc.fontSize(14).font('Helvetica-Bold').fillColor(teal).text('Architecture');
doc.fontSize(10).font('Helvetica-Oblique').fillColor(gray)
   .text('See attached: architecture-diagram.png');
doc.moveDown(0.3);

// Architecture box
doc.strokeColor(teal).lineWidth(1);
doc.rect(50, doc.y, 495, 85).stroke();
const archY = doc.y + 8;
doc.fontSize(10).font('Helvetica').fillColor(darkGray);
doc.text('The architecture consists of three main layers:', 60, archY);
doc.text('1. 3nzo Web App (Next.js on Vercel) — Dashboard, AI Chat, Campaigns, Settings', 60, archY + 14);
doc.text('2. API Layer — RESTful endpoints (/api/dashboard, /api/chat, /api/campaigns)', 60, archY + 28);
doc.text('3. Data Sources — Neon PostgreSQL (read) and Google Ads API (read/write)', 60, archY + 42);
doc.text('Daily sync at 6:30 AM pulls latest metrics from Google Ads API into our database.', 60, archY + 56);
doc.y = archY + 85;
doc.moveDown(0.8);

doc.fontSize(14).font('Helvetica-Bold').fillColor(teal).text('Data Flow');
doc.moveDown(0.3);
doc.fontSize(11).font('Helvetica-Bold').fillColor(navy).text('Reading (Reporting):');
doc.font('Helvetica').fillColor(darkGray);
doc.text('    1. Daily job pulls metrics from Google Ads API');
doc.text('    2. Data stored in Neon PostgreSQL (star schema)');
doc.text('    3. Dashboard UI queries database for metrics');
doc.text('    4. AI chat queries database for natural language responses');
doc.moveDown(0.4);

doc.font('Helvetica-Bold').fillColor(navy).text('Writing (Mutations):');
doc.font('Helvetica').fillColor(darkGray);
doc.text('    1. User initiates action (e.g., "Pause Campaign X")');
doc.text('    2. Confirmation dialog requires explicit approval');
doc.text('    3. API call made to Google Ads API');
doc.text('    4. Mutation logged in database for audit trail');
doc.moveDown(0.8);

// API Services - as simple lists, not tables
doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('API Services Called');
doc.moveDown(0.5);

doc.fontSize(14).font('Helvetica-Bold').fillColor(teal).text('Read Operations (Reporting)');
doc.moveDown(0.3);
doc.fontSize(10).font('Helvetica').fillColor(darkGray);

const readOps = [
  'GoogleAdsService → customer → Pull account-level performance metrics',
  'GoogleAdsService → campaign → Pull campaign-level metrics and status',
  'GoogleAdsService → ad_group → Pull ad group-level metrics and bids',
  'GoogleAdsService → search_term_view → Analyze search query performance',
  'CustomerService → customer → Retrieve account hierarchy for MCC',
];

readOps.forEach(op => {
  doc.text('    • ' + op);
});
doc.moveDown(0.5);

doc.fontSize(14).font('Helvetica-Bold').fillColor(teal).text('Write Operations (Mutations)');
doc.moveDown(0.3);
doc.fontSize(10).font('Helvetica').fillColor(darkGray);

const writeOps = [
  'CampaignService → MutateCampaigns → Pause/enable campaigns',
  'CampaignBudgetService → MutateCampaignBudgets → Adjust daily budgets',
  'AdGroupService → MutateAdGroups → Modify ad group bids and status',
];

writeOps.forEach(op => {
  doc.text('    • ' + op);
});

// ===================== PAGE 3 =====================
doc.addPage();

doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('GAQL Queries Used');
doc.moveDown(0.5);

doc.fontSize(12).font('Helvetica-Bold').fillColor(teal).text('Account Performance:');
doc.moveDown(0.2);

// Code block 1
const code1 = `SELECT
  segments.date,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.search_impression_share,
  metrics.search_budget_lost_impression_share,
  metrics.search_rank_lost_impression_share
FROM customer
WHERE segments.date DURING LAST_30_DAYS`;

doc.rect(50, doc.y, 495, 145).fill('#1e293b');
doc.fontSize(9).font('Courier').fillColor('#a5f3fc');
doc.text(code1, 60, doc.y - 135, { width: 475 });
doc.y += 20;
doc.moveDown(0.8);

doc.fontSize(12).font('Helvetica-Bold').fillColor(teal).text('Campaign Performance:');
doc.moveDown(0.2);

const code2 = `SELECT
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
  AND campaign.status != 'REMOVED'`;

doc.rect(50, doc.y, 495, 155).fill('#1e293b');
doc.fontSize(9).font('Courier').fillColor('#a5f3fc');
doc.text(code2, 60, doc.y - 145, { width: 475 });
doc.y += 20;
doc.moveDown(1);

// Security
doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('Security & Compliance');
doc.moveDown(0.4);
doc.fontSize(11).font('Helvetica').fillColor(darkGray);

const security = [
  ['OAuth 2.0', 'All API access uses OAuth 2.0 with refresh tokens stored securely'],
  ['Least Privilege', 'We only request scopes necessary for our operations'],
  ['Audit Logging', 'All mutations logged with timestamp, user, and values'],
  ['Confirmation Flows', 'Destructive actions require explicit user confirmation'],
  ['Rate Limiting', 'We respect API quotas and implement exponential backoff'],
  ['Data Retention', 'Performance data retained for reporting; no PII stored'],
];

security.forEach((s, i) => {
  doc.font('Helvetica-Bold').fillColor(teal).text(`${i + 1}. ${s[0]}`, { continued: true });
  doc.font('Helvetica').fillColor(darkGray).text(` — ${s[1]}`);
});

// ===================== PAGE 4 =====================
doc.addPage();

doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('Tool Screenshots');
doc.moveDown(0.4);
doc.fontSize(11).font('Helvetica-Oblique').fillColor(gray)
   .text('The following screenshots are included as separate attachments:');
doc.moveDown(0.3);

doc.font('Helvetica').fillColor(darkGray);
const screenshots = [
  ['architecture-diagram.png', 'System architecture showing data flow'],
  ['dashboard.png', 'Account Overview with KPIs and brand performance table'],
  ['campaigns.png', 'Expanded brand row showing individual campaigns'],
  ['chat.png', 'AI Chat interface with natural language query'],
  ['filters.png', 'Google Ads-style filters for accounts and campaigns'],
];

screenshots.forEach(s => {
  doc.font('Helvetica-Bold').fillColor(teal).text('    • ' + s[0], { continued: true });
  doc.font('Helvetica').fillColor(darkGray).text(' — ' + s[1]);
});

doc.moveDown(0.5);
doc.fontSize(10).font('Helvetica-Oblique').fillColor(gray)
   .text('Note: Screenshots show data from client accounts (OTT) currently being onboarded to our MCC.');
doc.moveDown(1.5);

// Contact
doc.strokeColor(teal).lineWidth(2);
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
doc.moveDown(0.8);

doc.fontSize(16).font('Helvetica-Bold').fillColor(navy).text('Contact Information');
doc.moveDown(0.4);
doc.fontSize(11);

const contact = [
  ['Company', 'Geeko Digital Media'],
  ['Contact', 'Russel Jan Fresnido'],
  ['Email', 'rfresnido@geekodmedia.com'],
  ['Website', 'https://geekodmedia.com'],
  ['Tool URL', 'https://3nzo.geekodmedia.com (internal access only)'],
];

contact.forEach(c => {
  doc.font('Helvetica-Bold').fillColor(navy).text(c[0] + ': ', { continued: true });
  doc.font('Helvetica').fillColor(darkGray).text(c[1]);
});

doc.moveDown(1);
doc.strokeColor('#e2e8f0').lineWidth(1);
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
doc.moveDown(0.4);
doc.fontSize(10).font('Helvetica-Oblique').fillColor(gray)
   .text('Document prepared for Google Ads API Developer Token application — Basic Access', { align: 'center' });

doc.end();

console.log(`PDF generated: ${outputPath}`);
