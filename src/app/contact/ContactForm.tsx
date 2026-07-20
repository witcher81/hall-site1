"use client";

import { useId, useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function ContactForm() {
  const nameId = useId();
  const emailId = useId();
  const subjectId = useId();
  const messageId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, turnstileToken }),
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
        ההודעה נשלחה. נחזור אליך בהקדם האפשרי.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-right text-sm">
      <div>
        <label htmlFor={nameId} className="block text-xs text-neutral-600">
          שם
        </label>
        <input
          id={nameId}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>
      <div>
        <label htmlFor={emailId} className="block text-xs text-neutral-600">
          אימייל
        </label>
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>
      <div>
        <label htmlFor={subjectId} className="block text-xs text-neutral-600">
          נושא (אופציונלי)
        </label>
        <input
          id={subjectId}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>
      <div>
        <label htmlFor={messageId} className="block text-xs text-neutral-600">
          הודעה
        </label>
        <textarea
          id={messageId}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
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
        {sending ? "שולח..." : "שליחה"}
      </button>
    </form>
  );
}
