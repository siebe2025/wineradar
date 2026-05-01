"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/client";
import type { Topic } from "@/lib/types";

const MAX_TOPICS = 5;

export default function TopicsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("topics").select("*").order("created_at");
    setTopics(data ?? []);
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
    setName("");
    setDescription("");
    setError(null);
    setShowForm(true);
  };

  const openEdit = (topic: Topic) => {
    setEditing(topic);
    setName(topic.name);
    setDescription(topic.description ?? "");
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

    if (!editing && topics.length >= MAX_TOPICS) {
      setError(`You can add at most ${MAX_TOPICS} topics.`);
      setSaving(false);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error: err } = await supabase.from("topics").update(payload).eq("id", editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from("topics").insert({ ...payload, user_id: userId });
      if (err) { setError(err.message); setSaving(false); return; }
    }

    await load();
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    await supabase.from("topics").delete().eq("id", id);
    await load();
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5 md:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#111]">Topics</h1>
            <p className="mt-0.5 text-sm text-gray-500">What to cover in your briefings (max {MAX_TOPICS})</p>
          </div>
          <button onClick={openNew} disabled={topics.length >= MAX_TOPICS} className="btn-primary whitespace-nowrap">
            Add topic
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic) => (
              <div key={topic.id} className="card flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#111] truncate">{topic.name}</p>
                    {topic.is_default && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 flex-shrink-0">Default</span>
                    )}
                  </div>
                  {topic.description && (
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{topic.description}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(topic)} className="btn-secondary text-xs px-3 py-2 min-h-0">Edit</button>
                  <button onClick={() => handleDelete(topic.id)} className="btn-danger text-xs px-3 py-2 min-h-0">Delete</button>
                </div>
              </div>
            ))}
            {topics.length === 0 && (
              <div className="card text-center py-12">
                <p className="text-gray-400 text-sm">No topics yet.</p>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white border border-[#E5E7EB] shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <span className="h-1 w-10 rounded-full bg-gray-200" />
              </div>

              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                <h2 className="font-semibold text-[#111]">{editing ? "Edit topic" : "Add topic"}</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-[#111] transition-colors p-1 -mr-1"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4">
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-3 text-sm text-red-700">{error}</div>
                )}
                <div>
                  <label className="label">Topic name *</label>
                  <input
                    required
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Market developments"
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input
                    className="input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description (optional)"
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary w-full sm:w-auto">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
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
