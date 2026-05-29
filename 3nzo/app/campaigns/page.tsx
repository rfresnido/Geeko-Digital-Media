"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

// Mock data - will be replaced with real Neon queries
const mockCampaigns = [
  {
    id: 1,
    brand: "Amazing Lash Studio",
    name: "ALS | Brand | Search | National",
    status: "ENABLED",
    dailyBudget: 150,
    spend7d: 892.45,
    impressions: 45678,
    clicks: 1234,
    conversions: 89,
    searchIS: 78.2,
    adGroups: [
      { id: 101, name: "Brand - Exact", status: "ENABLED", bid: 1.25, clicks: 456, convRate: 8.2 },
      { id: 102, name: "Brand - Phrase", status: "ENABLED", bid: 1.10, clicks: 389, convRate: 6.8 },
      { id: 103, name: "Brand - Broad", status: "PAUSED", bid: 0.85, clicks: 389, convRate: 5.1 },
    ],
  },
  {
    id: 2,
    brand: "Amazing Lash Studio",
    name: "ALS | Non-Brand | Search | National",
    status: "ENABLED",
    dailyBudget: 250,
    spend7d: 1456.78,
    impressions: 89234,
    clicks: 2345,
    conversions: 67,
    searchIS: 52.4,
    adGroups: [
      { id: 201, name: "Lash Extensions", status: "ENABLED", bid: 2.50, clicks: 890, convRate: 3.2 },
      { id: 202, name: "Eyelash Services", status: "ENABLED", bid: 2.25, clicks: 756, convRate: 2.8 },
    ],
  },
  {
    id: 3,
    brand: "Radiant Waxing",
    name: "RW | Brand | Search",
    status: "PAUSED",
    dailyBudget: 75,
    spend7d: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    searchIS: 0,
    adGroups: [],
  },
];

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        status === "ENABLED"
          ? "bg-geeko-lime/20 text-geeko-lime"
          : "bg-muted text-muted-foreground"
      )}
    >
      {status === "ENABLED" ? (
        <Play className="h-3 w-3" />
      ) : (
        <Pause className="h-3 w-3" />
      )}
      {status}
    </span>
  );
}

function CampaignRow({
  campaign,
  isExpanded,
  onToggle,
}: {
  campaign: (typeof mockCampaigns)[0];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-4 px-4">
          <button className="p-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </td>
        <td className="py-4 px-4">
          <div>
            <p className="font-medium text-geeko-navy">{campaign.name}</p>
            <p className="text-sm text-muted-foreground">{campaign.brand}</p>
          </div>
        </td>
        <td className="py-4 px-4">
          <StatusBadge status={campaign.status} />
        </td>
        <td className="py-4 px-4 text-right">{formatCurrency(campaign.dailyBudget)}</td>
        <td className="py-4 px-4 text-right">{formatCurrency(campaign.spend7d)}</td>
        <td className="py-4 px-4 text-right">{campaign.clicks.toLocaleString()}</td>
        <td className="py-4 px-4 text-right">{campaign.conversions}</td>
        <td className="py-4 px-4 text-right">
          <span
            className={cn(
              campaign.searchIS >= 70
                ? "text-geeko-lime"
                : campaign.searchIS >= 50
                ? "text-geeko-orange"
                : "text-red-500"
            )}
          >
            {campaign.searchIS}%
          </span>
        </td>
        <td className="py-4 px-4">
          <div className="flex gap-2 justify-end">
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title={campaign.status === "ENABLED" ? "Pause" : "Enable"}
            >
              {campaign.status === "ENABLED" ? (
                <Pause className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Play className="h-4 w-4 text-geeko-lime" />
              )}
            </button>
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Edit Budget"
            >
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Ad Groups */}
      {isExpanded && campaign.adGroups.length > 0 && (
        <tr>
          <td colSpan={9} className="bg-muted/30 px-4 py-4">
            <div className="ml-8">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Ad Groups ({campaign.adGroups.length})
              </h4>
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="text-left py-2 px-3">Ad Group</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">CPC Bid</th>
                    <th className="text-right py-2 px-3">Clicks</th>
                    <th className="text-right py-2 px-3">Conv Rate</th>
                    <th className="text-right py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.adGroups.map((ag) => (
                    <tr key={ag.id} className="border-t border-border/50">
                      <td className="py-2 px-3 text-sm">{ag.name}</td>
                      <td className="py-2 px-3">
                        <StatusBadge status={ag.status} />
                      </td>
                      <td className="py-2 px-3 text-right text-sm">
                        {formatCurrency(ag.bid)}
                      </td>
                      <td className="py-2 px-3 text-right text-sm">
                        {ag.clicks.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-sm">{ag.convRate}%</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="p-1 rounded hover:bg-muted transition-colors"
                            title="Adjust Bid"
                          >
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CampaignsPage() {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<number>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCampaign = (id: number) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredCampaigns = mockCampaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-geeko-navy">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage campaigns and ad groups
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-geeko-teal focus:border-transparent w-64"
          />
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="card-metric overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10"></th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Campaign
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Budget
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Spend (7d)
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Clicks
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Conv
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Search IS
                </th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => (
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  isExpanded={expandedCampaigns.has(campaign.id)}
                  onToggle={() => toggleCampaign(campaign.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
