"use client";

import { useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function PrivacyRequestForm() {
  const [requestType, setRequestType] = useState("access");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/privacy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          fullName,
          email,
          details,
          turnstileToken,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שליחה נכשלה");
        setSending(false);
        return;
      }
      setDone(true);
    } catch {
      setError("שגיאה בלתי צפויה");
      setSending(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-emerald-800" role="status">
        הבקשה נשלחה. נטפל בה בהתאם לחוק ונחזור אליך בדוא״ל.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-right text-sm">
      <div>
        <label className="block text-xs text-neutral-600">סוג בקשה</label>
        <select
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:border-amber-400"
        >
          <option value="access">עיון במידע</option>
          <option value="rectify">תיקון מידע</option>
          <option value="delete">מחיקת מידע</option>
          <option value="other">אחר</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-600">שם מלא</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-600">אימייל לאימות</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-600">פרטים נוספים</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>
      <TurnstileWidget onToken={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-300 disabled:opacity-60"
      >
        {sending ? "שולח..." : "שליחת בקשה"}
      </button>
    </form>
  );
}
