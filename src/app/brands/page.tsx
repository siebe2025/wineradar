"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/client";
import type { Brand } from "@/lib/types";

const MAX_BRANDS = 5;

const EMPTY: Omit<Brand, "id" | "user_id" | "created_at" | "updated_at"> = {
  name: "",
  region: "",
  country: "",
  notes: "",
};

export default function BrandsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("brands").select("*").order("created_at");
    setBrands(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      await load();
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setForm({ name: brand.name, region: brand.region ?? "", country: brand.country ?? "", notes: brand.notes ?? "" });
    setError(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!userId) {
      setError("Not authenticated. Please refresh the page.");
      setSaving(false);
      return;
    }

    if (!editing && brands.length >= MAX_BRANDS) {
      setError(`You can add at most ${MAX_BRANDS} brands.`);
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      region: form.region?.trim() || null,
      country: form.country?.trim() || null,
      notes: form.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error: err } = await supabase.from("brands").update(payload).eq("id", editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from("brands").insert({ ...payload, user_id: userId });
      if (err) { setError(err.message); setSaving(false); return; }
    }

    await load();
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brand? Briefing items referencing it will be kept.")) return;
    await supabase.from("brands").delete().eq("id", id);
    await load();
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#111]">Brands</h1>
            <p className="mt-1 text-sm text-gray-500">Wine brands you track (max {MAX_BRANDS})</p>
          </div>
          <button onClick={openNew} disabled={brands.length >= MAX_BRANDS} className="btn-primary">
            Add brand
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>
        ) : brands.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-sm">No brands yet. Add your first wine brand.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {brands.map((brand) => (
              <div key={brand.id} className="card flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[#111]">{brand.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {[brand.region, brand.country].filter(Boolean).join(", ") || "No region/country set"}
                  </p>
                  {brand.notes && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{brand.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(brand)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
                  <button onClick={() => handleDelete(brand.id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white border border-[#E5E7EB] shadow-xl">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="font-semibold text-[#111]">{editing ? "Edit brand" : "Add brand"}</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-[#111] transition-colors text-xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
                )}
                <div>
                  <label className="label">Brand name *</label>
                  <input
                    required
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Château Margaux"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Region</label>
                    <input
                      className="input"
                      value={form.region ?? ""}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      placeholder="e.g. Bordeaux"
                    />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <input
                      className="input"
                      value={form.country ?? ""}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      placeholder="e.g. France"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    value={form.notes ?? ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Key accounts, positioning, etc."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
