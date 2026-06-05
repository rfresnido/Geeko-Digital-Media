const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
const outputPath = './google-ads-api-design-documentation.pdf';

doc.pipe(fs.createWriteStream(outputPath));

// Helper function for drawing tables
function drawTable(doc, headers, rows, columnWidths, startX = 50) {
  const rowHeight = 25;
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  let y = doc.y;

  // Header background
  doc.fillColor('#1e3a5f').rect(startX, y, tableWidth, rowHeight).fill();

  // Header text
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x + 8, y + 8, { width: columnWidths[i] - 16 });
    x += columnWidths[i];
  });

  y += rowHeight;

  // Rows
  doc.font('Helvetica').fontSize(10);
  rows.forEach((row, rowIndex) => {
    // Alternating row colors
    const bgColor = rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.fillColor(bgColor).rect(startX, y, tableWidth, rowHeight).fill();

    // Row text
    doc.fillColor('#334155');
    x = startX;
    row.forEach((cell, i) => {
      doc.text(cell, x + 8, y + 8, { width: columnWidths[i] - 16 });
      x += columnWidths[i];
    });

    y += rowHeight;
  });

  // Border
  doc.strokeColor('#e2e8f0').lineWidth(1);
  doc.rect(startX, doc.y, tableWidth, y - doc.y).stroke();

  doc.y = y + 10;
  doc.fillColor('#000000');
}

// Title
doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e3a5f')
   .text('Google Ads API Design Documentation', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).font('Helvetica').fillColor('#64748b')
   .text('Application for Developer Token — Basic Access', { align: 'center' });
doc.moveDown(0.5);

// Horizontal line
doc.strokeColor('#0d9488').lineWidth(2);
doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(1);

// Company Name
doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('Company Name');
doc.fontSize(11).font('Helvetica').fillColor('#334155').text('Geeko Digital Media');
doc.moveDown(1);

// Business Model
doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('Business Model');
doc.fontSize(11).font('Helvetica').fillColor('#334155')
   .text('Geeko Digital Media is a digital marketing agency specializing in paid media management for franchise and multi-location businesses.', { lineGap: 4 });
doc.moveDown(0.5);

doc.font('Helvetica-Bold').fillColor('#0d9488').text('MCC: ', { continued: true });
doc.font('Helvetica').fillColor('#334155').text('Geeko Digital Media - MCC (Customer ID: 503-015-3115)');
doc.moveDown(0.5);

doc.font('Helvetica-Bold').fillColor('#1e3a5f').text('Current Accounts Under Management:');
doc.font('Helvetica').fillColor('#334155')
   .text('• 9 Dots - Ads Grant (Customer ID: 921-382-6651) — Google Ad Grants nonprofit account', { indent: 20 })
   .text('• 9 Dots (Customer ID: 285-964-4846)', { indent: 20 })
   .text('• Geeko Digital Media (Customer ID: 373-401-0058)', { indent: 20 });
doc.moveDown(0.5);

doc.font('Helvetica-Bold').fillColor('#1e3a5f').text('Upcoming Client Accounts (OTT - Onboarding in Progress):');
doc.font('Helvetica').fillColor('#334155')
   .text('• Radiant Waxing', { indent: 20 })
   .text('• Amazing Lash Studio', { indent: 20 })
   .text('• Drybar', { indent: 20 })
   .text('• The Joint Chiropractic — MCC with 109 franchise locations', { indent: 20 })
   .text('• Pause Studio', { indent: 20 });
doc.moveDown(0.5);

doc.text('All accounts are owned by our clients and managed under our agency\'s MCC. We only manage Google Ads for contracted clients and do not resell API access to third parties.');
doc.moveDown(1);

// Tool Name
doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('Tool Name');
doc.fontSize(11).font('Helvetica-Bold').fillColor('#0d9488').text('3nzo', { continued: true });
doc.font('Helvetica').fillColor('#334155').text(' — AI-Powered Paid Media Command Center');
doc.moveDown(1);

// Tool Access/Use
doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('Tool Access/Use');
doc.fontSize(11).font('Helvetica').fillColor('#334155')
   .text('3nzo is an internal agency tool used exclusively by Geeko Digital Media employees to:', { lineGap: 4 });
doc.moveDown(0.5);

const features = [
  ['View Performance Data', 'Unified dashboard displaying metrics across all managed accounts including impressions, clicks, conversions, spend, CTR, CPC, CPA, and Search Impression Share.'],
  ['Generate Reports', 'Visual reports with date range selection, filterable by account, campaign status, and campaign name.'],
  ['AI-Assisted Queries', 'Natural language chat interface allowing team members to ask questions like "What\'s the spend this week?"'],
  ['Campaign Management', 'Ability to pause/enable campaigns, adjust daily budgets, and modify bids (with confirmation flows).'],
  ['Automated Monitoring', 'Daily sync of performance data at 6:30 AM to maintain up-to-date reporting.'],
];

features.forEach((f, i) => {
  doc.font('Helvetica-Bold').fillColor('#0d9488').text(`${i + 1}. ${f[0]}`, { continued: true, indent: 15 });
  doc.font('Helvetica').fillColor('#334155').text(` — ${f[1]}`);
  doc.moveDown(0.2);
});

doc.moveDown(0.5);
doc.font('Helvetica-Bold').fillColor('#1e3a5f').text('Access Control:');
doc.font('Helvetica').fillColor('#334155')
   .text('• Only authenticated Geeko Digital Media employees can access the tool', { indent: 20 })
   .text('• The tool is hosted at https://3nzo.geekodmedia.com (internal access only)', { indent: 20 })
   .text('• Clients receive exported reports but cannot access the tool directly', { indent: 20 });

// New page for Architecture
doc.addPage();

// Architecture section
doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('Tool Design');
doc.moveDown(0.5);

doc.fontSize(14).font('Helvetica-Bold').fillColor('#0d9488').text('Architecture');
doc.moveDown(0.3);
doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b')
   .text('See attached: architecture-diagram.png for visual representation');
doc.moveDown(0.5);

// Architecture description in a box
doc.fillColor('#f0fdfa').rect(50, doc.y, 500, 100).fill();
doc.strokeColor('#0d9488').rect(50, doc.y, 500, 100).stroke();

const boxY = doc.y + 10;
doc.fontSize(10).font('Helvetica').fillColor('#334155');
doc.text('The architecture consists of three main layers:', 60, boxY);
doc.text('1. 3nzo Web App (Next.js on Vercel) — Dashboard, AI Chat, Campaigns, Settings', 60, boxY + 18);
doc.text('2. API Layer — RESTful endpoints for data operations (/api/dashboard, /api/chat, etc.)', 60, boxY + 36);
doc.text('3. Data Sources — Neon PostgreSQL (read replica) and Google Ads API (read/write)', 60, boxY + 54);
doc.text('Daily sync at 6:30 AM pulls latest metrics from Google Ads API into our database.', 60, boxY + 72);

doc.y += 115;
doc.moveDown(0.5);

// Data Flow
doc.fontSize(14).font('Helvetica-Bold').fillColor('#0d9488').text('Data Flow');
doc.moveDown(0.3);

doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a5f').text('Reading Data (Reporting):');
doc.font('Helvetica').fillColor('#334155')
   .text('1. Daily scheduled job pulls metrics from Google Ads API', { indent: 20 })
   .text('2. Data is transformed and stored in Neon PostgreSQL (star schema)', { indent: 20 })
   .text('3. Dashboard UI queries the database to display metrics', { indent: 20 })
   .text('4. AI chat queries the database for natural language responses', { indent: 20 });
doc.moveDown(0.5);

doc.font('Helvetica-Bold').fillColor('#1e3a5f').text('Writing Data (Mutations):');
doc.font('Helvetica').fillColor('#334155')
   .text('1. User initiates action in UI (e.g., "Pause Campaign X")', { indent: 20 })
   .text('2. Confirmation dialog requires explicit approval', { indent: 20 })
   .text('3. API call made to Google Ads API', { indent: 20 })
   .text('4. Mutation logged in database for audit trail', { indent: 20 });
doc.moveDown(1);

// API Services Called
doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('API Services Called');
doc.moveDown(0.5);

doc.fontSize(14).font('Helvetica-Bold').fillColor('#0d9488').text('Read Operations (Reporting)');
doc.moveDown(0.5);

drawTable(doc,
  ['Service', 'Resource', 'Purpose'],
  [
    ['GoogleAdsService', 'customer', 'Pull account-level performance metrics'],
    ['GoogleAdsService', 'campaign', 'Pull campaign-level metrics and status'],
    ['GoogleAdsService', 'ad_group', 'Pull ad group-level metrics and bids'],
    ['GoogleAdsService', 'search_term_view', 'Analyze search query performance'],
    ['CustomerService', 'customer', 'Retrieve account hierarchy for MCC'],
  ],
  [150, 120, 230]
);

doc.moveDown(0.5);
doc.fontSize(14).font('Helvetica-Bold').fillColor('#0d9488').text('Write Operations (Mutations)');
doc.moveDown(0.5);

drawTable(doc,
  ['Service', 'Operation', 'Purpose'],
  [
    ['CampaignService', 'MutateCampaigns', 'Pause/enable campaigns'],
    ['CampaignBudgetService', 'MutateCampaignBudgets', 'Adjust daily budgets'],
    ['AdGroupService', 'MutateAdGroups', 'Modify ad group bids and status'],
  ],
  [160, 160, 180]
);

// New page for GAQL and Security
doc.addPage();

// GAQL Queries
doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('GAQL Queries Used');
doc.moveDown(0.5);

doc.fontSize(12).font('Helvetica-Bold').fillColor('#0d9488').text('Account Performance:');
doc.moveDown(0.3);

// Code block
doc.fillColor('#1e293b').rect(50, doc.y, 500, 130).fill();
doc.fontSize(9).font('Courier').fillColor('#a5f3fc');
const gaqlY = doc.y + 10;
doc.text('SELECT', 60, gaqlY);
doc.text('  segments.date,', 60, gaqlY + 12);
doc.text('  metrics.impressions,', 60, gaqlY + 24);
doc.text('  metrics.clicks,', 60, gaqlY + 36);
doc.text('  metrics.cost_micros,', 60, gaqlY + 48);
doc.text('  metrics.conversions,', 60, gaqlY + 60);
doc.text('  metrics.search_impression_share,', 60, gaqlY + 72);
doc.text('  metrics.search_budget_lost_impression_share,', 60, gaqlY + 84);
doc.text('  metrics.search_rank_lost_impression_share', 60, gaqlY + 96);
doc.text('FROM customer', 60, gaqlY + 108);

doc.y += 145;
doc.moveDown(0.5);

doc.fontSize(12).font('Helvetica-Bold').fillColor('#0d9488').text('Campaign Performance:');
doc.moveDown(0.3);

doc.fillColor('#1e293b').rect(50, doc.y, 500, 130).fill();
const gaql2Y = doc.y + 10;
doc.fontSize(9).font('Courier').fillColor('#a5f3fc');
doc.text('SELECT', 60, gaql2Y);
doc.text('  campaign.id,', 60, gaql2Y + 12);
doc.text('  campaign.name,', 60, gaql2Y + 24);
doc.text('  campaign.status,', 60, gaql2Y + 36);
doc.text('  campaign_budget.amount_micros,', 60, gaql2Y + 48);
doc.text('  metrics.impressions,', 60, gaql2Y + 60);
doc.text('  metrics.clicks,', 60, gaql2Y + 72);
doc.text('  metrics.cost_micros,', 60, gaql2Y + 84);
doc.text('  metrics.conversions', 60, gaql2Y + 96);
doc.text('FROM campaign', 60, gaql2Y + 108);

doc.y += 145;
doc.moveDown(1);

// Security
doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('Security & Compliance');
doc.moveDown(0.5);

const securityItems = [
  ['OAuth 2.0', 'All API access uses OAuth 2.0 with refresh tokens stored securely'],
  ['Least Privilege', 'We only request scopes necessary for our operations'],
  ['Audit Logging', 'All mutations logged with timestamp, user, and values'],
  ['Confirmation Flows', 'Destructive actions require explicit user confirmation'],
  ['Rate Limiting', 'We respect API quotas and implement exponential backoff'],
  ['Data Retention', 'Performance data retained for reporting; no PII stored'],
];

securityItems.forEach((item, i) => {
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0d9488').text(`${i + 1}. ${item[0]}`, { continued: true });
  doc.font('Helvetica').fillColor('#334155').text(` — ${item[1]}`);
  doc.moveDown(0.3);
});

// New page for Screenshots
doc.addPage();

// Tool Screenshots section
doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('Tool Screenshots');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica-Oblique').fillColor('#64748b')
   .text('The following screenshots are included as separate attachments:');
doc.moveDown(0.5);

const screenshots = [
  ['architecture-diagram.png', 'System architecture showing data flow'],
  ['dashboard.png', 'Account Overview with KPIs and brand performance table'],
  ['campaigns.png', 'Expanded brand row showing individual campaigns'],
  ['chat.png', 'AI Chat interface with natural language query'],
  ['filters.png', 'Google Ads-style filters for accounts and campaigns'],
];

screenshots.forEach(s => {
  doc.font('Helvetica-Bold').fillColor('#0d9488').text(`• ${s[0]}`, { continued: true, indent: 20 });
  doc.font('Helvetica').fillColor('#334155').text(` — ${s[1]}`);
  doc.moveDown(0.2);
});

doc.moveDown(0.5);
doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b')
   .text('Note: Screenshots show data from client accounts (OTT) currently being onboarded to our MCC.', { indent: 20 });
doc.moveDown(1.5);

// Contact Information
doc.strokeColor('#0d9488').lineWidth(2);
doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(1);

doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f').text('Contact Information');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica').fillColor('#334155');

const contactInfo = [
  ['Company', 'Geeko Digital Media'],
  ['Contact', 'Russel Jan Fresnido'],
  ['Email', 'rfresnido@geekodmedia.com'],
  ['Website', 'https://geekodmedia.com'],
  ['Tool URL', 'https://3nzo.geekodmedia.com (internal access only)'],
];

contactInfo.forEach(c => {
  doc.font('Helvetica-Bold').fillColor('#1e3a5f').text(`${c[0]}: `, { continued: true });
  doc.font('Helvetica').fillColor('#334155').text(c[1]);
});

doc.moveDown(1);
doc.strokeColor('#e2e8f0').lineWidth(1);
doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(0.5);
doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b')
   .text('Document prepared for Google Ads API Developer Token application — Basic Access', { align: 'center' });

doc.end();

console.log(`PDF generated: ${outputPath}`);
