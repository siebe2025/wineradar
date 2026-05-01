"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/client";
import type { EmailSettings } from "@/lib/types";

const SEND_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendDay, setSendDay] = useState("monday");
  const [isEnabled, setIsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      const { data } = await supabase.from("email_settings").select("*").maybeSingle();
      if (data) {
        setSettings(data);
        setRecipientEmail(data.recipient_email);
        setSendDay(data.send_day);
        setIsEnabled(data.is_enabled);
      }
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!userId) {
      setMessage({ type: "error", text: "Not authenticated. Please refresh the page." });
      setSaving(false);
      return;
    }

    const payload = {
      recipient_email: recipientEmail.trim(),
      send_day: sendDay,
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    };

    let err;
    if (settings) {
      ({ error: err } = await supabase.from("email_settings").update(payload).eq("id", settings.id));
    } else {
      ({ error: err } = await supabase.from("email_settings").insert({ ...payload, user_id: userId }));
    }

    if (err) {
      setMessage({ type: "error", text: err.message });
    } else {
      setMessage({ type: "success", text: "Settings saved." });
      const { data } = await supabase.from("email_settings").select("*").maybeSingle();
      setSettings(data ?? null);
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    const supabase2 = createClient();
    await supabase2.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-5 md:space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#111]">Settings</h1>
          <p className="mt-0.5 text-sm text-gray-500">Configure your weekly briefing delivery</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <form onSubmit={handleSave} className="card space-y-5">
            <div>
              <label className="label">Recipient email *</label>
              <input
                type="email"
                required
                className="input"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="account-manager@yourcompany.com"
              />
              <p className="mt-1.5 text-xs text-gray-400">Briefings will be sent to this address.</p>
            </div>

            <div>
              <label className="label">Send day</label>
              <select
                className="input"
                value={sendDay}
                onChange={(e) => setSendDay(e.target.value)}
              >
                {SEND_DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#111]">Weekly emails</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Automated briefings each {sendDay.charAt(0).toUpperCase() + sendDay.slice(1)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-wine-700 focus:ring-offset-2 flex-shrink-0 ${
                  isEnabled ? "bg-wine-700" : "bg-gray-200"
                }`}
                aria-label={isEnabled ? "Disable weekly emails" : "Enable weekly emails"}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    isEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {message && (
              <div
                className={`rounded-md px-3 py-3 text-sm leading-relaxed ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Saving…" : "Save settings"}
            </button>
          </form>
        )}

        {/* Log out — accessible on mobile since top nav is hidden */}
        <div className="md:hidden">
          <button
            onClick={handleLogout}
            className="btn-secondary w-full text-gray-500"
          >
            Log out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
