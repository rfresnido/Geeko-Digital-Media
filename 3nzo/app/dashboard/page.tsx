import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  DollarSign,
  Target,
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
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
  { brand: "Amazing Lash Studio", spend: 4521.34, clicks: 16234, convs: 312, searchIS: 78.2, trend: "up" },
  { brand: "Paused Studio", spend: 3890.12, clicks: 14567, convs: 289, searchIS: 71.5, trend: "up" },
  { brand: "Radiant Waxing", spend: 2345.67, clicks: 8765, convs: 178, searchIS: 68.3, trend: "down" },
  { brand: "Drybar", spend: 1693.54, clicks: 6112, convs: 113, searchIS: 82.1, trend: "up" },
];

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  format = "number",
  featured = false,
}: {
  title: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  format?: "number" | "currency" | "percent";
  featured?: boolean;
}) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
      ? formatPercent(value)
      : formatNumber(value);

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  if (featured) {
    return (
      <div className="card-gradient col-span-2">
        <div className="flex items-start justify-between">
          <div className="icon-container-gradient">
            <Icon className="h-6 w-6" />
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-sm font-semibold text-white">
              {isPositive && <TrendingUp className="h-4 w-4" />}
              {isNegative && <TrendingDown className="h-4 w-4" />}
              {isPositive && "+"}
              {change.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="stat-value-light">{formattedValue}</p>
          <p className="stat-label-light mt-0.5">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-metric">
      <div className="flex items-start justify-between">
        <div className="icon-container">
          <Icon className="h-5 w-5" />
        </div>
        {change !== undefined && (
          <div className={isPositive ? "stat-change-positive" : isNegative ? "stat-change-negative" : "text-slate-400 text-sm"}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isPositive && "+"}
            {change.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="stat-value">{formattedValue}</p>
        <p className="stat-label mt-0.5">{title}</p>
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
    <div className="card-metric col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="icon-container">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-geeko-navy">Competitive Metrics</h3>
            <p className="text-[10px] text-slate-400">Search impression share</p>
          </div>
        </div>
        <span className="badge-success">
          <Sparkles className="h-2.5 w-2.5" />
          Good
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">Search IS</span>
            <span className="font-bold text-geeko-teal">{searchIS}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-geeko-teal to-teal-400"
              style={{ width: `${searchIS}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Lost IS (Budget)
            </span>
            <span className="font-bold text-amber-600">{lostBudget}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-amber-400 to-amber-500"
              style={{ width: `${lostBudget}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">Lost IS (Rank)</span>
            <span className="font-bold text-slate-600">{lostRank}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-slate-400 to-slate-500"
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
    <div className="p-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-geeko-navy to-geeko-teal bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Last 7 days • All brands
          </p>
        </div>
        <button className="btn-primary">
          <ArrowUpRight className="h-3 w-3" />
          Export
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <MetricCard
          title="Total Spend"
          value={mockKPIs.totalSpend}
          change={mockKPIs.spendChange}
          icon={DollarSign}
          format="currency"
          featured
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-geeko-navy">Performance by Brand</h3>
            <p className="text-[10px] text-slate-400">Click row for details</p>
          </div>
          <button className="btn-secondary">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">Brand</th>
                <th className="table-header text-right">Spend</th>
                <th className="table-header text-right">Clicks</th>
                <th className="table-header text-right">Conversions</th>
                <th className="table-header text-right">Search IS</th>
                <th className="table-header text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {mockBrandData.map((row) => (
                <tr key={row.brand} className="table-row cursor-pointer">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-geeko-teal/10 to-geeko-sky/10 flex items-center justify-center text-geeko-teal font-bold text-[10px]">
                        {row.brand.charAt(0)}
                      </div>
                      <span className="font-semibold text-geeko-navy text-xs">{row.brand}</span>
                    </div>
                  </td>
                  <td className="table-cell text-right font-semibold">{formatCurrency(row.spend)}</td>
                  <td className="table-cell text-right text-slate-600">{formatNumber(row.clicks)}</td>
                  <td className="table-cell text-right text-slate-600">{formatNumber(row.convs)}</td>
                  <td className="table-cell text-right">
                    <span className={`font-semibold ${row.searchIS >= 75 ? "text-emerald-600" : row.searchIS >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                      {row.searchIS}%
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    {row.trend === "up" ? (
                      <span className="stat-change-positive">
                        <TrendingUp className="h-2.5 w-2.5" />
                        Up
                      </span>
                    ) : (
                      <span className="stat-change-negative">
                        <TrendingDown className="h-2.5 w-2.5" />
                        Down
                      </span>
                    )}
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
