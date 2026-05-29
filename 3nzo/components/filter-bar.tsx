"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, X, ChevronDown, Check, Search } from "lucide-react";

export interface FilterState {
  accounts: string[];
  status: string[];
  minSpend: number | null;
  maxSpend: number | null;
  searchQuery: string;
}

interface FilterBarProps {
  availableAccounts: string[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export const defaultFilters: FilterState = {
  accounts: [],
  status: [],
  minSpend: null,
  maxSpend: null,
  searchQuery: "",
};

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
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

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => onChange(options);
  const clearAll = () => onChange([]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
          selected.length > 0
            ? "border-geeko-teal bg-geeko-teal/5 text-geeko-teal"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
        }`}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="bg-geeko-teal text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{placeholder}</span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-[10px] text-geeko-teal hover:underline"
              >
                All
              </button>
              <button
                onClick={clearAll}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => toggleOption(option)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-lg hover:bg-slate-50"
              >
                <div
                  className={`h-4 w-4 rounded border flex items-center justify-center ${
                    selected.includes(option)
                      ? "bg-geeko-teal border-geeko-teal"
                      : "border-slate-300"
                  }`}
                >
                  {selected.includes(option) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-slate-700">{option}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({ availableAccounts, filters, onChange }: FilterBarProps) {
  const statusOptions = ["Active", "Paused"];

  const activeFilterCount =
    (filters.accounts.length > 0 ? 1 : 0) +
    (filters.status.length > 0 ? 1 : 0) +
    (filters.minSpend !== null ? 1 : 0) +
    (filters.maxSpend !== null ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  const clearAllFilters = () => onChange(defaultFilters);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Filter className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-geeko-teal text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </div>

      <div className="h-4 w-px bg-slate-200" />

      <MultiSelectDropdown
        label="Account"
        options={availableAccounts}
        selected={filters.accounts}
        onChange={(accounts) => onChange({ ...filters, accounts })}
        placeholder="Select accounts"
      />

      <MultiSelectDropdown
        label="Status"
        options={statusOptions}
        selected={filters.status}
        onChange={(status) => onChange({ ...filters, status })}
        placeholder="Campaign status"
      />

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search brands..."
          value={filters.searchQuery}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white w-40 focus:outline-none focus:border-geeko-teal focus:ring-1 focus:ring-geeko-teal/20"
        />
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 rounded hover:bg-slate-100"
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}
    </div>
  );
}
