const { createCanvas } = require('canvas');
const fs = require('fs');

const width = 1200;
const height = 700;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Colors
const colors = {
  background: '#f8fafc',
  primary: '#0d9488',      // Teal
  primaryLight: '#14b8a6',
  secondary: '#1e3a5f',    // Navy
  secondaryLight: '#2d4a6f',
  white: '#ffffff',
  gray: '#64748b',
  grayLight: '#e2e8f0',
  accent: '#06b6d4',       // Cyan
};

// Background
ctx.fillStyle = colors.background;
ctx.fillRect(0, 0, width, height);

// Helper functions
function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBox(x, y, w, h, fillColor, borderColor, shadowColor) {
  // Shadow
  if (shadowColor) {
    ctx.fillStyle = shadowColor;
    roundedRect(x + 4, y + 4, w, h, 12);
    ctx.fill();
  }

  // Box
  ctx.fillStyle = fillColor;
  roundedRect(x, y, w, h, 12);
  ctx.fill();

  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawText(text, x, y, font, color, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawArrow(fromX, fromY, toX, toY, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLength = 10;

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawDashedLine(fromX, fromY, toX, toY, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.setLineDash([]);
}

// Title
drawText('3nzo Architecture', width / 2, 45, 'bold 28px Arial', colors.secondary);
drawText('AI-Powered Paid Media Command Center', width / 2, 72, '16px Arial', colors.gray);

// ============ TOP LAYER: 3nzo Web App ============
drawBox(100, 100, 1000, 130, colors.secondary, null, 'rgba(30, 58, 95, 0.2)');
drawText('3nzo Web App', 600, 135, 'bold 18px Arial', colors.white);
drawText('Next.js on Vercel  •  https://3nzo.geekodmedia.com', 600, 158, '13px Arial', 'rgba(255,255,255,0.7)');

// Sub-modules
const modules = [
  { name: 'Dashboard', icon: '📊', x: 150 },
  { name: 'AI Chat', icon: '💬', x: 370 },
  { name: 'Campaigns', icon: '🎯', x: 590 },
  { name: 'Settings', icon: '⚙️', x: 810 },
];

modules.forEach(mod => {
  drawBox(mod.x, 175, 180, 40, 'rgba(255,255,255,0.15)', null, null);
  drawText(`${mod.icon} ${mod.name}`, mod.x + 90, 200, '14px Arial', colors.white);
});

// ============ MIDDLE LAYER: API Layer ============
drawBox(100, 270, 1000, 80, colors.white, colors.grayLight, 'rgba(0,0,0,0.08)');
drawText('API Layer', 600, 300, 'bold 16px Arial', colors.secondary);

const apis = ['/api/dashboard', '/api/chat', '/api/campaigns', '/api/mutations'];
apis.forEach((api, i) => {
  const x = 180 + i * 220;
  drawText(api, x, 328, '12px monospace', colors.gray);
});

// ============ BOTTOM LAYER: Data Sources ============

// Neon PostgreSQL
drawBox(100, 400, 440, 200, colors.white, colors.primary, 'rgba(13, 148, 136, 0.15)');
drawText('Neon PostgreSQL', 320, 435, 'bold 16px Arial', colors.primary);
drawText('Read Replica • Singapore Region', 320, 455, '11px Arial', colors.gray);

// Database tables
const tables = [
  { name: 'dim_brands', desc: 'Account info' },
  { name: 'dim_campaigns', desc: 'Campaign metadata' },
  { name: 'fact_performance', desc: 'Metrics data' },
  { name: 'mutation_log', desc: 'Audit trail' },
];

tables.forEach((table, i) => {
  const y = 480 + i * 28;
  drawBox(130, y - 12, 200, 24, colors.background, null, null);
  drawText(table.name, 230, y + 4, '12px monospace', colors.secondary, 'center');
  drawText(table.desc, 430, y + 4, '11px Arial', colors.gray, 'left');
});

// Google Ads API
drawBox(660, 400, 440, 200, colors.white, colors.accent, 'rgba(6, 182, 212, 0.15)');
drawText('Google Ads API', 880, 435, 'bold 16px Arial', colors.accent);
drawText('OAuth 2.0 • MCC: 503-015-3115', 880, 455, '11px Arial', colors.gray);

// API Services
const services = [
  { name: 'GoogleAdsService', desc: 'Reporting queries' },
  { name: 'CampaignService', desc: 'Pause/Enable' },
  { name: 'CampaignBudgetService', desc: 'Budget changes' },
  { name: 'AdGroupService', desc: 'Bid adjustments' },
];

services.forEach((svc, i) => {
  const y = 480 + i * 28;
  drawBox(690, y - 12, 200, 24, colors.background, null, null);
  drawText(svc.name, 790, y + 4, '12px monospace', colors.secondary, 'center');
  drawText(svc.desc, 990, y + 4, '11px Arial', colors.gray, 'left');
});

// ============ ARROWS ============

// App to API layer
drawArrow(600, 230, 600, 268, colors.gray);

// API to Neon
drawArrow(400, 352, 320, 398, colors.primary);

// API to Google Ads
drawArrow(800, 352, 880, 398, colors.accent);

// Labels on arrows
ctx.save();
ctx.translate(340, 375);
ctx.rotate(-0.4);
drawText('Read', 0, 0, '11px Arial', colors.primary, 'center');
ctx.restore();

ctx.save();
ctx.translate(860, 375);
ctx.rotate(0.4);
drawText('Read/Write', 0, 0, '11px Arial', colors.accent, 'center');
ctx.restore();

// ============ SYNC INDICATOR ============
drawDashedLine(545, 500, 655, 500, colors.gray);
drawText('Daily Sync 6:30 AM', 600, 520, '10px Arial', colors.gray);

// ============ LEGEND ============
drawBox(100, 630, 1000, 50, colors.white, colors.grayLight, null);
drawText('Legend:', 150, 660, 'bold 12px Arial', colors.secondary, 'left');

// Read operations
ctx.fillStyle = colors.primary;
ctx.fillRect(220, 648, 20, 12);
drawText('Read Operations (Reporting)', 340, 660, '12px Arial', colors.gray, 'left');

// Write operations
ctx.fillStyle = colors.accent;
ctx.fillRect(540, 648, 20, 12);
drawText('Write Operations (Mutations)', 660, 660, '12px Arial', colors.gray, 'left');

// Sync
ctx.strokeStyle = colors.gray;
ctx.setLineDash([6, 3]);
ctx.beginPath();
ctx.moveTo(860, 654);
ctx.lineTo(900, 654);
ctx.stroke();
ctx.setLineDash([]);
drawText('Scheduled Sync', 1000, 660, '12px Arial', colors.gray, 'left');

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./docs/screenshots/architecture-diagram.png', buffer);
console.log('Architecture diagram created: ./docs/screenshots/architecture-diagram.png');
