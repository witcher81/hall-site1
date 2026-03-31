"use client";

import { useState } from "react";
import IsraeliMobilePhoneInput from "@/components/IsraeliMobilePhoneInput";

type Props = {
  user: {
    id: number;
    name: string | null;
    email: string;
    phone: string | null;
  };
};

export default function SettingsClient({ user }: Props) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setProfileMessage(data?.error || "שמירת הפרטים נכשלה");
      } else {
        setProfileMessage("הפרטים נשמרו בהצלחה");
      }
    } catch {
      setProfileMessage("שגיאה בלתי צפויה");
    }
    setSavingProfile(false);
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage("הסיסמה החדשה חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("הסיסמאות אינן תואמות");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPasswordMessage(data?.error || "עדכון הסיסמה נכשל");
      } else {
        setPasswordMessage("הסיסמה עודכנה בהצלחה");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMessage("שגיאה בלתי צפויה");
    }
    setSavingPassword(false);
  }

  return (
    <div className="mt-6 space-y-8 text-right text-sm">
      <section className="rounded-2xl border border-[#E0D4C3] bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
        <h2 className="text-base font-semibold text-[#0F3B2E]">פרטי פרופיל</h2>
        <p className="mt-1 text-xs text-[#6B6560]">
          השם והטלפון שלך עשויים להופיע בפניות ובבקשות כדי שיוכלו לחזור אליך.
        </p>
        <form onSubmit={handleProfileSave} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-[#5F5F5F]">שם מלא</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
            />
          </div>
          <div>
            <label className="block text-xs text-[#5F5F5F]">טלפון</label>
            <IsraeliMobilePhoneInput
              value={phone}
              onChange={setPhone}
              forceMobile={false}
              selectClassName="shrink-0 rounded-xl border border-[#E0D4C3] bg-white px-2 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              inputClassName="min-w-0 flex-1 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              legacyInputClassName="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
            />
            <p className="mt-1 text-xs text-[#6B6560]">
              מספר נייד: קידומת ואז 7 ספרות. קווי: הזנה ידנית מלאה.
            </p>
          </div>
          <div>
            <label className="block text-xs text-[#5F5F5F]">אימייל (לא ניתן לשינוי)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] px-3 py-2 text-sm text-[#6B6560]"
            />
          </div>
          {profileMessage && (
            <p
              className={`text-xs ${
                profileMessage.includes("הצלחה")
                  ? "text-emerald-800"
                  : "text-red-700"
              }`}
            >
              {profileMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-full bg-[#C9A227] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
          >
            {savingProfile ? "שומר..." : "שמירת פרופיל"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[#E0D4C3] bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
        <h2 className="text-base font-semibold text-[#0F3B2E]">שינוי סיסמה</h2>
        <p className="mt-1 text-xs text-[#6B6560]">
          בחר סיסמה חזקה שקל לך לזכור. מינימום 6 תווים.
        </p>
        <form onSubmit={handlePasswordSave} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-[#5F5F5F]">סיסמה נוכחית</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#5F5F5F]">סיסמה חדשה</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#5F5F5F]">אישור סיסמה חדשה</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              required
            />
          </div>
          {passwordMessage && (
            <p
              className={`text-xs ${
                passwordMessage.includes("הצלחה")
                  ? "text-emerald-800"
                  : "text-red-700"
              }`}
            >
              {passwordMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-full border border-[#E0D4C3] bg-[#FAF8F4] px-5 py-2 text-sm font-semibold text-[#0F3B2E] hover:bg-[#EFE6D5] disabled:opacity-60"
          >
            {savingPassword ? "מעדכן..." : "עדכון סיסמה"}
          </button>
        </form>
      </section>
    </div>
  );
}
