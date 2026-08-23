"use client";

import { useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";
import { isCaptchaSubmitReady } from "@/lib/turnstileClient";

const labelClass = "block text-sm font-medium text-[var(--foreground)]";

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
        <label className={labelClass}>סוג בקשה</label>
        <select
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className="site-input mt-1"
        >
          <option value="access">עיון במידע</option>
          <option value="rectify">תיקון מידע</option>
          <option value="delete">מחיקת מידע</option>
          <option value="other">אחר</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>שם מלא</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="site-input mt-1"
        />
      </div>
      <div>
        <label className={labelClass}>אימייל לאימות</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="site-input mt-1"
        />
      </div>
      <div>
        <label className={labelClass}>פרטים נוספים</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          className="site-input mt-1"
        />
      </div>
      <TurnstileWidget onToken={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={sending || !isCaptchaSubmitReady(turnstileToken)}
        className="btn-primary disabled:opacity-60"
      >
        {sending ? "שולח..." : "שליחת בקשה"}
      </button>
    </form>
  );
}
