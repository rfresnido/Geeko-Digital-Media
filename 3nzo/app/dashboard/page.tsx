"use client";

import { useState, useEffect, Fragment } from "react";
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
  ChevronDown,
  ChevronRight,
  Circle,
  Pause,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { DateRangePicker } from "@/components/date-range-picker";
import { ColumnCustomizer, defaultColumns, type ColumnConfig } from "@/components/column-customizer";

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
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  cvr: number;
  searchIS: number;
  lostISBudget: number;
  lostISRank: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  totalDailyBudget: number;
  trend: "up" | "down" | "flat";
}

interface Campaign {
  campaign_id: number;
  campaign_name: string;
  status: string;
  daily_budget: number;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  cvr: number;
  search_is: number;
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

function formatCellValue(value: unknown, format?: string, columnId?: string): string {
  if (value === null || value === undefined) return "N/A";
  if (columnId === "brand" || columnId === "campaign_name") return String(value);

  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);

  switch (format) {
    case "currency":
      return formatCurrency(numValue);
    case "percent":
      return `${numValue.toFixed(1)}%`;
    case "number":
    default:
      return formatNumber(numValue);
  }
}

function BrandTable({
  brands,
  columns,
  onColumnsChange,
  dateRange,
}: {
  brands: BrandPerformance[];
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  dateRange: { startDate: string; endDate: string };
}) {
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const visibleColumns = columns.filter((c) => c.visible);

  const handleBrandClick = async (brand: string) => {
    if (expandedBrand === brand) {
      setExpandedBrand(null);
      setCampaigns([]);
      return;
    }

    setExpandedBrand(brand);
    setLoadingCampaigns(true);

    try {
      const response = await fetch(
        `/api/campaigns?brand=${encodeURIComponent(brand)}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

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
          <p className="text-[10px] text-slate-400">Click row to expand campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnCustomizer columns={columns} onChange={onColumnsChange} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="table-header w-8"></th>
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className={`table-header ${col.id !== "brand" ? "text-right" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brands.map((row) => (
              <Fragment key={row.brand}>
                <tr
                  className="table-row cursor-pointer hover:bg-geeko-teal/5"
                  onClick={() => handleBrandClick(row.brand)}
                >
                  <td className="table-cell w-8">
                    {expandedBrand === row.brand ? (
                      <ChevronDown className="h-4 w-4 text-geeko-teal" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </td>
                  {visibleColumns.map((col) => {
                    const value = row[col.id as keyof BrandPerformance];

                    if (col.id === "brand") {
                      return (
                        <td key={col.id} className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-geeko-teal/10 to-geeko-sky/10 flex items-center justify-center text-geeko-teal font-bold text-[10px]">
                              {row.brand.charAt(0)}
                            </div>
                            <span className="font-semibold text-geeko-navy text-xs">{row.brand}</span>
                          </div>
                        </td>
                      );
                    }

                    if (col.id === "trend") {
                      return (
                        <td key={col.id} className="table-cell text-right">
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
                      );
                    }

                    if (col.id === "searchIS") {
                      return (
                        <td key={col.id} className="table-cell text-right">
                          <span className={`font-semibold ${row.searchIS >= 75 ? "text-emerald-600" : row.searchIS >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                            {row.searchIS.toFixed(1)}%
                          </span>
                        </td>
                      );
                    }

                    if (col.id === "activeCampaigns" || col.id === "pausedCampaigns") {
                      const isActive = col.id === "activeCampaigns";
                      return (
                        <td key={col.id} className="table-cell text-right">
                          <span className={`text-xs font-medium ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                            {formatCellValue(value, col.format, col.id)}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={col.id}
                        className={`table-cell text-right ${col.id === "spend" ? "font-semibold" : "text-slate-600"}`}
                      >
                        {formatCellValue(value, col.format, col.id)}
                      </td>
                    );
                  })}
                </tr>

                {/* Expanded campaigns */}
                {expandedBrand === row.brand && (
                  <tr key={`${row.brand}-campaigns`}>
                    <td colSpan={visibleColumns.length + 1} className="p-0">
                      <div className="bg-slate-50/50 border-y border-slate-100">
                        {loadingCampaigns ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-geeko-teal" />
                          </div>
                        ) : campaigns.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            No campaigns found
                          </div>
                        ) : (
                          <div className="px-4 py-3">
                            <table className="w-full">
                              <thead>
                                <tr className="text-[10px] text-slate-400 uppercase tracking-wider">
                                  <th className="text-left py-2 px-2 font-semibold">Campaign</th>
                                  <th className="text-center py-2 px-2 font-semibold">Status</th>
                                  <th className="text-right py-2 px-2 font-semibold">Budget</th>
                                  <th className="text-right py-2 px-2 font-semibold">Impr.</th>
                                  <th className="text-right py-2 px-2 font-semibold">Clicks</th>
                                  <th className="text-right py-2 px-2 font-semibold">Spend</th>
                                  <th className="text-right py-2 px-2 font-semibold">Conv.</th>
                                  <th className="text-right py-2 px-2 font-semibold">CTR</th>
                                  <th className="text-right py-2 px-2 font-semibold">CPC</th>
                                  <th className="text-right py-2 px-2 font-semibold">CPA</th>
                                </tr>
                              </thead>
                              <tbody>
                                {campaigns.map((campaign) => (
                                  <tr
                                    key={campaign.campaign_id}
                                    className="border-t border-slate-100 hover:bg-white/50 text-xs"
                                  >
                                    <td className="py-2 px-2">
                                      <span className="text-slate-700 font-medium">
                                        {campaign.campaign_name}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      {campaign.status === "ENABLED" ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-600">
                                          <Circle className="h-2 w-2 fill-current" />
                                          Active
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-400">
                                          <Pause className="h-2.5 w-2.5" />
                                          Paused
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-right text-slate-600">
                                      {campaign.daily_budget ? formatCurrency(campaign.daily_budget) : "—"}
                                    </td>
                                    <td className="py-2 px-2 text-right text-slate-600">
                                      {formatNumber(campaign.impressions)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-slate-600">
                                      {formatNumber(campaign.clicks)}
                                    </td>
                                    <td className="py-2 px-2 text-right font-semibold text-slate-700">
                                      {formatCurrency(campaign.spend)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-slate-600">
                                      {formatNumber(campaign.conversions)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-slate-600">
                                      {campaign.ctr.toFixed(2)}%
                                    </td>
                                    <td className="py-2 px-2 text-right text-slate-600">
                                      {formatCurrency(campaign.cpc)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-slate-600">
                                      {campaign.cpa > 0 ? formatCurrency(campaign.cpa) : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
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
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboard-columns");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultColumns;
        }
      }
    }
    return defaultColumns;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard-columns", JSON.stringify(columns));
    }
  }, [columns]);

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
      <BrandTable
        brands={brands}
        columns={columns}
        onColumnsChange={setColumns}
        dateRange={dateRange}
      />
    </div>
  );
}
