"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { DateRangePicker } from "@/components/date-range-picker";

interface DashboardKPIs {
  totalSpend: number;
  spendChange: number;
  impressions: number;
  impressionsChange: number;
  clicks: number;
  clicksChange: number;
  conversions: number;
  conversionsChange: number;
  avgCPC: number;
  avgCTR: number;
  searchIS: number;
  lostISBudget: number;
  lostISRank: number;
}

interface BrandPerformance {
  brand: string;
  spend: number;
  clicks: number;
  convs: number;
  searchIS: number;
  trend: "up" | "down" | "flat";
}

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

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
  const status = searchIS >= 70 ? "Good" : searchIS >= 50 ? "Fair" : "Low";
  const statusClass = searchIS >= 70 ? "badge-success" : searchIS >= 50 ? "badge-warning" : "badge-neutral";

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
        <span className={statusClass}>
          <Sparkles className="h-2.5 w-2.5" />
          {status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">Search IS</span>
            <span className="font-bold text-geeko-teal">{searchIS.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-geeko-teal to-teal-400"
              style={{ width: `${Math.min(searchIS, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Lost IS (Budget)
            </span>
            <span className="font-bold text-amber-600">{lostBudget.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-amber-400 to-amber-500"
              style={{ width: `${Math.min(lostBudget, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">Lost IS (Rank)</span>
            <span className="font-bold text-slate-600">{lostRank.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-slate-400 to-slate-500"
              style={{ width: `${Math.min(lostRank, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandTable({ brands }: { brands: BrandPerformance[] }) {
  if (brands.length === 0) {
    return (
      <div className="card-metric">
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No data for selected date range</p>
        </div>
      </div>
    );
  }

  return (
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
            {brands.map((row) => (
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
                    {row.searchIS.toFixed(1)}%
                  </span>
                </td>
                <td className="table-cell text-right">
                  {row.trend === "up" ? (
                    <span className="stat-change-positive">
                      <TrendingUp className="h-2.5 w-2.5" />
                      Up
                    </span>
                  ) : row.trend === "down" ? (
                    <span className="stat-change-negative">
                      <TrendingDown className="h-2.5 w-2.5" />
                      Down
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">Flat</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState(getDefaultDates);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [brands, setBrands] = useState<BrandPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setKpis(data.kpis);
        setBrands(data.brands);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  const handleDateChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  if (isLoading || !kpis) {
    return (
      <div className="p-5 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-geeko-teal" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-geeko-navy to-geeko-teal bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            All brands
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={handleDateChange}
          />
          <button className="btn-primary">
            <ArrowUpRight className="h-3 w-3" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <MetricCard
          title="Total Spend"
          value={kpis.totalSpend}
          change={kpis.spendChange}
          icon={DollarSign}
          format="currency"
          featured
        />
        <MetricCard
          title="Impressions"
          value={kpis.impressions}
          change={kpis.impressionsChange}
          icon={Eye}
        />
        <MetricCard
          title="Clicks"
          value={kpis.clicks}
          change={kpis.clicksChange}
          icon={MousePointerClick}
        />
        <MetricCard
          title="Conversions"
          value={kpis.conversions}
          change={kpis.conversionsChange}
          icon={Target}
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
        <MetricCard
          title="Avg. CPC"
          value={kpis.avgCPC}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Avg. CTR"
          value={kpis.avgCTR}
          icon={MousePointerClick}
          format="percent"
        />
        <CompetitiveCard
          searchIS={kpis.searchIS}
          lostBudget={kpis.lostISBudget}
          lostRank={kpis.lostISRank}
        />
      </div>

      {/* Brand Performance Table */}
      <BrandTable brands={brands} />
    </div>
  );
}
