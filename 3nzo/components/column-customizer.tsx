"use client";

import { useState, useRef, useEffect } from "react";
import { Settings2, GripVertical, Eye, EyeOff, X } from "lucide-react";

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  format?: "number" | "currency" | "percent";
}

interface ColumnCustomizerProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
}

export const defaultColumns: ColumnConfig[] = [
  { id: "brand", label: "Brand", visible: true },
  { id: "spend", label: "Spend", visible: true, format: "currency" },
  { id: "impressions", label: "Impressions", visible: false, format: "number" },
  { id: "clicks", label: "Clicks", visible: true, format: "number" },
  { id: "conversions", label: "Conversions", visible: true, format: "number" },
  { id: "ctr", label: "CTR", visible: false, format: "percent" },
  { id: "cpc", label: "CPC", visible: false, format: "currency" },
  { id: "cpa", label: "CPA", visible: false, format: "currency" },
  { id: "cvr", label: "CVR", visible: false, format: "percent" },
  { id: "searchIS", label: "Search IS", visible: true, format: "percent" },
  { id: "lostISBudget", label: "Lost IS (Budget)", visible: false, format: "percent" },
  { id: "lostISRank", label: "Lost IS (Rank)", visible: false, format: "percent" },
  { id: "activeCampaigns", label: "Active Campaigns", visible: false, format: "number" },
  { id: "pausedCampaigns", label: "Paused Campaigns", visible: false, format: "number" },
  { id: "totalDailyBudget", label: "Daily Budget", visible: false, format: "currency" },
  { id: "trend", label: "Trend", visible: true },
];

export function ColumnCustomizer({ columns, onChange }: ColumnCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (id: string) => {
    if (id === "brand") return; // Brand is always visible
    const updated = columns.map((col) =>
      col.id === id ? { ...col, visible: !col.visible } : col
    );
    onChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...columns];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, removed);
    setDraggedIndex(index);
    onChange(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const visibleCount = columns.filter((c) => c.visible).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2"
      >
        <Settings2 className="h-3.5 w-3.5" />
        <span className="text-xs">Columns ({visibleCount})</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Customize Columns</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>

          <div className="p-2 max-h-80 overflow-y-auto">
            <p className="text-[10px] text-slate-400 px-2 mb-2">
              Drag to reorder • Click eye to show/hide
            </p>
            {columns.map((column, index) => (
              <div
                key={column.id}
                draggable={column.id !== "brand"}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  draggedIndex === index ? "bg-geeko-teal/10" : "hover:bg-slate-50"
                } ${column.id === "brand" ? "opacity-50" : "cursor-move"}`}
              >
                <GripVertical className={`h-3.5 w-3.5 text-slate-300 ${column.id === "brand" ? "invisible" : ""}`} />
                <span className="flex-1 text-xs text-slate-600">{column.label}</span>
                <button
                  onClick={() => toggleColumn(column.id)}
                  disabled={column.id === "brand"}
                  className={`p-1 rounded transition-colors ${
                    column.visible
                      ? "text-geeko-teal hover:bg-geeko-teal/10"
                      : "text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {column.visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-slate-100">
            <button
              onClick={() => onChange(defaultColumns)}
              className="w-full text-xs text-slate-500 hover:text-geeko-teal py-1.5"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
