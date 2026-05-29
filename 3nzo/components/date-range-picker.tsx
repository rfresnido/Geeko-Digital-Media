"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

const presets = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "This month", days: "thisMonth" },
  { label: "Last month", days: "lastMonth" },
];

function getPresetDates(preset: number | string): { start: string; end: string } {
  const today = new Date();
  const end = new Date(today);
  let start = new Date(today);

  if (typeof preset === "number") {
    start.setDate(today.getDate() - preset + 1);
  } else if (preset === "thisMonth") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (preset === "lastMonth") {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    end.setDate(0); // Last day of previous month
  }

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.toLocaleDateString("en-US", { ...options, year: "numeric" })} - ${end.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
  }

  return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}, ${end.getFullYear()}`;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);
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

  useEffect(() => {
    setCustomStart(startDate);
    setCustomEnd(endDate);
  }, [startDate, endDate]);

  const handlePresetClick = (preset: number | string) => {
    const { start, end } = getPresetDates(preset);
    onChange(start, end);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange(customStart, customEnd);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2"
      >
        <Calendar className="h-3.5 w-3.5" />
        <span className="text-xs">{formatDateRange(startDate, endDate)}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          {/* Presets */}
          <div className="p-2 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Quick Select
            </p>
            <div className="space-y-0.5">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.days)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-geeko-teal/10 hover:text-geeko-teal rounded-lg transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div className="p-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Custom Range
            </p>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 mb-1 block">Start</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={customEnd}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-geeko-teal/20 focus:border-geeko-teal"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 mb-1 block">End</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-geeko-teal/20 focus:border-geeko-teal"
                />
              </div>
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd || customStart > customEnd}
              className="w-full btn-primary text-xs py-1.5"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
