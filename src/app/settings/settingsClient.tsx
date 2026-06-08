"use client";

import Link from "next/link";
import { useState } from "react";
import CookiePreferencesSection from "@/components/consent/CookiePreferencesSection";
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
      <nav
        aria-label="קטגוריות הגדרות"
        className="flex flex-wrap gap-2 text-xs font-medium text-neutral-600"
      >
        <a href="#profile" className="rounded-full border border-neutral-200 px-3 py-1 hover:border-amber-400">
          פרופיל
        </a>
        <a href="#security" className="rounded-full border border-neutral-200 px-3 py-1 hover:border-amber-400">
          אבטחה
        </a>
        <a href="#privacy" className="rounded-full border border-neutral-200 px-3 py-1 hover:border-amber-400">
          פרטיות
        </a>
        <a href="#legal" className="rounded-full border border-neutral-200 px-3 py-1 hover:border-amber-400">
          מסמכים
        </a>
        <a href="#account" className="rounded-full border border-neutral-200 px-3 py-1 hover:border-amber-400">
          חשבון
        </a>
      </nav>

      <section
        id="profile"
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
      >
        <h2 className="text-base font-semibold text-emerald-950">פרטי פרופיל</h2>
        <p className="mt-1 text-xs text-neutral-600">
          השם והטלפון שלך עשויים להופיע בפניות ובבקשות כדי שיוכלו לחזור אליך.
        </p>
        <form onSubmit={handleProfileSave} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-neutral-600">שם מלא</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600">טלפון</label>
            <IsraeliMobilePhoneInput
              value={phone}
              onChange={setPhone}
              forceMobile={false}
              selectClassName="shrink-0 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              inputClassName="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              legacyInputClassName="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            />
            <p className="mt-1 text-xs text-neutral-600">
              מספר נייד: קידומת ואז 7 ספרות. קווי: הזנה ידנית מלאה.
            </p>
          </div>
          <div>
            <label className="block text-xs text-neutral-600">אימייל (לא ניתן לשינוי)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
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
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-300 disabled:opacity-60"
          >
            {savingProfile ? "שומר..." : "שמירת פרופיל"}
          </button>
        </form>
      </section>

      <section
        id="security"
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
      >
        <h2 className="text-base font-semibold text-emerald-950">אבטחה — שינוי סיסמה</h2>
        <p className="mt-1 text-xs text-neutral-600">
          בחר סיסמה חזקה שקל לך לזכור. מינימום 6 תווים.
        </p>
        <form onSubmit={handlePasswordSave} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-neutral-600">סיסמה נוכחית</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600">סיסמה חדשה</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600">אישור סיסמה חדשה</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
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
            className="rounded-full border border-neutral-200 bg-neutral-50 px-5 py-2 text-sm font-semibold text-emerald-950 hover:bg-neutral-50 disabled:opacity-60"
          >
            {savingPassword ? "מעדכן..." : "עדכון סיסמה"}
          </button>
        </form>
      </section>

      <div id="privacy">
        <CookiePreferencesSection />
      </div>

      <section
        id="legal"
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
      >
        <h2 className="text-base font-semibold text-emerald-950">מסמכים משפטיים</h2>
        <p className="mt-1 text-xs text-neutral-600">
          תנאי שימוש, פרטיות ועוגיות — זמינים תמיד לעיון.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <Link href="/terms" className="font-medium text-emerald-950 underline">
              תנאי שימוש
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="font-medium text-emerald-950 underline">
              מדיניות פרטיות
            </Link>
          </li>
          <li>
            <Link href="/cookies" className="font-medium text-emerald-950 underline">
              מדיניות עוגיות
            </Link>
          </li>
        </ul>
      </section>

      <section
        id="account"
        className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-[0_12px_40px_rgba(15,59,46,0.04)]"
      >
        <h2 className="text-base font-semibold text-red-900">אזור מסוכן — חשבון</h2>
        <p className="mt-1 text-xs text-neutral-700">
          מחיקת חשבון היא פעולה בלתי הפיכה. לבקשת מחיקה, פנו אלינו בדוא״ל ונאמת את הבקשה.
        </p>
        <p className="mt-3 text-xs">
          <a
            href="mailto:privacy@hallshub.example?subject=%D7%91%D7%A7%D7%A9%D7%AA%20%D7%9E%D7%97%D7%99%D7%A7%D7%AA%20%D7%97%D7%A9%D7%91%D7%95%D7%9F"
            className="inline-flex rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-semibold text-red-900 hover:bg-red-50"
          >
            בקשת מחיקת חשבון
          </a>
        </p>
      </section>
    </div>
  );
}
