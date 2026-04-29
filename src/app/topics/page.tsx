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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#111]">Topics</h1>
            <p className="mt-1 text-sm text-gray-500">What to cover in your briefings (max {MAX_TOPICS})</p>
          </div>
          <button onClick={openNew} disabled={topics.length >= MAX_TOPICS} className="btn-primary">
            Add topic
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic) => (
              <div key={topic.id} className="card flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#111]">{topic.name}</p>
                    {topic.is_default && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Default</span>
                    )}
                  </div>
                  {topic.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{topic.description}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(topic)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
                  <button onClick={() => handleDelete(topic.id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white border border-[#E5E7EB] shadow-xl">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
                <h2 className="font-semibold text-[#111]">{editing ? "Edit topic" : "Add topic"}</h2>
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
