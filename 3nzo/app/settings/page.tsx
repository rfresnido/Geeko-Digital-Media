"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface Brand {
  brand_id: number;
  brand_name: string;
  customer_id: string;
  is_mcc: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newBrand, setNewBrand] = useState({
    brand_name: "",
    customer_id: "",
    is_mcc: false,
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands");
      if (!response.ok) throw new Error("Failed to fetch brands");
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      setError("Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBrand),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add account");
      }

      const created = await response.json();
      setBrands((prev) => [...prev, created].sort((a, b) => a.brand_name.localeCompare(b.brand_name)));
      setNewBrand({ brand_name: "", customer_id: "", is_mcc: false });
      setShowAddForm(false);
      setSuccess("Account added successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brandId: number, brandName: string) => {
    if (!confirm(`Are you sure you want to delete "${brandName}"? This cannot be undone.`)) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      setBrands((prev) => prev.filter((b) => b.brand_id !== brandId));
      setSuccess("Account deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  const formatCustomerId = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-geeko-navy to-geeko-teal bg-clip-text text-transparent flex items-center gap-2">
            <Settings className="h-5 w-5 text-geeko-teal" />
            Settings
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage Google Ads accounts and preferences
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Google Ads Accounts Section */}
      <div className="card-metric">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-geeko-navy">Google Ads Accounts</h2>
            <p className="text-[10px] text-slate-400">
              Manage connected Google Ads accounts
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
            disabled={showAddForm}
          >
            <Plus className="h-3 w-3" />
            Add Account
          </button>
        </div>

        {/* Add Account Form */}
        {showAddForm && (
          <form onSubmit={handleAddBrand} className="mb-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={newBrand.brand_name}
                  onChange={(e) => setNewBrand((prev) => ({ ...prev, brand_name: e.target.value }))}
                  placeholder="e.g., Amazing Lash Studio"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer ID *
                </label>
                <input
                  type="text"
                  value={newBrand.customer_id}
                  onChange={(e) => setNewBrand((prev) => ({ ...prev, customer_id: formatCustomerId(e.target.value) }))}
                  placeholder="123-456-7890"
                  className="input-field"
                  maxLength={12}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Account Type
                </label>
                <div className="flex items-center gap-4 h-[38px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="account_type"
                      checked={!newBrand.is_mcc}
                      onChange={() => setNewBrand((prev) => ({ ...prev, is_mcc: false }))}
                      className="text-geeko-teal focus:ring-geeko-teal"
                    />
                    <span className="text-sm text-slate-600">Client</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="account_type"
                      checked={newBrand.is_mcc}
                      onChange={() => setNewBrand((prev) => ({ ...prev, is_mcc: true }))}
                      className="text-geeko-teal focus:ring-geeko-teal"
                    />
                    <span className="text-sm text-slate-600">MCC</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewBrand({ brand_name: "", customer_id: "", is_mcc: false });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !newBrand.brand_name || !newBrand.customer_id}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    Add Account
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Accounts Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-geeko-teal" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No accounts added yet</p>
            <p className="text-xs text-slate-400">Click "Add Account" to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">Brand</th>
                  <th className="table-header">Customer ID</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Added</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.brand_id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-geeko-teal/10 to-geeko-sky/10 flex items-center justify-center text-geeko-teal font-bold text-[10px]">
                          {brand.brand_name.charAt(0)}
                        </div>
                        <span className="font-semibold text-geeko-navy text-xs">
                          {brand.brand_name}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {brand.customer_id}
                      </code>
                    </td>
                    <td className="table-cell">
                      {brand.is_mcc ? (
                        <span className="badge-warning">MCC</span>
                      ) : (
                        <span className="badge-success">Client</span>
                      )}
                    </td>
                    <td className="table-cell text-slate-500 text-xs">
                      {new Date(brand.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => handleDeleteBrand(brand.brand_id, brand.brand_name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Future: Authentication Section */}
      <div className="card-metric mt-4 opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-geeko-navy">Team Authentication</h2>
            <p className="text-[10px] text-slate-400">
              Coming soon: User login and per-user Google Ads authorization
            </p>
          </div>
          <span className="badge-neutral">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
