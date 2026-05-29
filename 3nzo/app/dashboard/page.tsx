import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  DollarSign,
  Target,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

// Mock data - will be replaced with real Neon queries
const mockKPIs = {
  totalSpend: 12450.67,
  spendChange: 8.3,
  impressions: 1234567,
  impressionsChange: 12.4,
  clicks: 45678,
  clicksChange: -2.1,
  conversions: 892,
  conversionsChange: 15.7,
  avgCPC: 0.27,
  avgCTR: 3.7,
  searchIS: 72.4,
  lostISBudget: 8.2,
  lostISRank: 19.4,
};

const mockBrandData = [
  { brand: "Amazing Lash Studio", spend: 4521.34, clicks: 16234, convs: 312, searchIS: 78.2 },
  { brand: "Paused Studio", spend: 3890.12, clicks: 14567, convs: 289, searchIS: 71.5 },
  { brand: "Radiant Waxing", spend: 2345.67, clicks: 8765, convs: 178, searchIS: 68.3 },
  { brand: "Drybar", spend: 1693.54, clicks: 6112, convs: 113, searchIS: 82.1 },
];

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  format = "number",
}: {
  title: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  format?: "number" | "currency" | "percent";
}) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
      ? formatPercent(value)
      : formatNumber(value);

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="card-metric">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-geeko-teal/10 p-2">
          <Icon className="h-5 w-5 text-geeko-teal" />
        </div>
        {change !== undefined && (
          <div className={isPositive ? "stat-change-positive" : isNegative ? "stat-change-negative" : "text-muted-foreground text-sm"}>
            {isPositive && <TrendingUp className="inline h-4 w-4 mr-1" />}
            {isNegative && <TrendingDown className="inline h-4 w-4 mr-1" />}
            {isPositive && "+"}
            {change.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="stat-value">{formattedValue}</p>
        <p className="stat-label mt-1">{title}</p>
      </div>
    </div>
  );
}

function CompetitiveCard({
  searchIS,
  lostBudget,
  lostRank,
}: {
  searchIS: number;
  lostBudget: number;
  lostRank: number;
}) {
  return (
    <div className="card-metric">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-geeko-teal" />
        <h3 className="font-semibold text-geeko-navy">Competitive Metrics</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Search Impression Share</span>
            <span className="font-medium text-geeko-navy">{searchIS}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-geeko-teal rounded-full"
              style={{ width: `${searchIS}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-geeko-orange" />
              Lost IS (Budget)
            </span>
            <span className="font-medium text-geeko-orange">{lostBudget}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-geeko-orange rounded-full"
              style={{ width: `${lostBudget}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Lost IS (Rank)</span>
            <span className="font-medium text-geeko-navy">{lostRank}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-geeko-sky rounded-full"
              style={{ width: `${lostRank}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-geeko-navy">Dashboard</h1>
        <p className="text-muted-foreground">
          Last 7 days • All brands
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Spend"
          value={mockKPIs.totalSpend}
          change={mockKPIs.spendChange}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Impressions"
          value={mockKPIs.impressions}
          change={mockKPIs.impressionsChange}
          icon={Eye}
        />
        <MetricCard
          title="Clicks"
          value={mockKPIs.clicks}
          change={mockKPIs.clicksChange}
          icon={MousePointerClick}
        />
        <MetricCard
          title="Conversions"
          value={mockKPIs.conversions}
          change={mockKPIs.conversionsChange}
          icon={Target}
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Avg. CPC"
          value={mockKPIs.avgCPC}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Avg. CTR"
          value={mockKPIs.avgCTR}
          icon={MousePointerClick}
          format="percent"
        />
        <CompetitiveCard
          searchIS={mockKPIs.searchIS}
          lostBudget={mockKPIs.lostISBudget}
          lostRank={mockKPIs.lostISRank}
        />
      </div>

      {/* Brand Performance Table */}
      <div className="card-metric">
        <h3 className="font-semibold text-geeko-navy mb-4">Performance by Brand</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Brand</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Spend</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Clicks</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Conversions</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Search IS</th>
              </tr>
            </thead>
            <tbody>
              {mockBrandData.map((row) => (
                <tr key={row.brand} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium text-geeko-navy">{row.brand}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(row.spend)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(row.clicks)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(row.convs)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={row.searchIS >= 75 ? "text-geeko-lime" : row.searchIS >= 60 ? "text-geeko-orange" : "text-red-500"}>
                      {row.searchIS}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
