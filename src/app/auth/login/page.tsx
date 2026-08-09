"use client";

import { FormEvent, Suspense, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TurnstileWidget from "@/components/TurnstileWidget";
import PasswordInput from "@/components/PasswordInput";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterLogin = safeInternalPath(searchParams.get("redirect"));
  const isCheckout = searchParams.get("checkout") === "1";
  const emailId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string) || "";
    const password = (formData.get("password") as string) || "";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שגיאה בהתחברות");
        setLoading(false);
        return;
      }

      const role = data?.user?.role as string | undefined;
      const needsVerify = data?.requiresEmailVerification === true;

      if (needsVerify) {
        if (typeof data?.emailWarning === "string") {
          try {
            sessionStorage.setItem("hall_verify_email_warning", data.emailWarning);
          } catch {
            /* ignore */
          }
        }
        if (typeof data?.devCode === "string") {
          try {
            sessionStorage.setItem("hall_dev_verify_code", data.devCode);
          } catch {
            /* ignore */
          }
        }
        const verifyQ = afterLogin
          ? `?redirect=${encodeURIComponent(afterLogin)}`
          : "";
        router.push(`/auth/verify-email${verifyQ}`);
      } else if (afterLogin) {
        router.push(afterLogin);
      } else if (role === "VENUE_OWNER") {
        router.push("/dashboard/venue-owner/profile");
      } else if (role === "FREELANCER") {
        router.push("/dashboard/freelancer");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("שגיאה בלתי צפויה");
      setLoading(false);
    }
  }

  return (
    <div className="site-page">
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="auth-kicker">EVENT FOR YOU</p>
        <h1 className="auth-page-title">התחברות</h1>
        {isCheckout ? (
          <p className="auth-alert-info mt-2">
            התחברו כדי להשלים את ההזמנה שמילאתם כאורח.
          </p>
        ) : null}
        <a href="/" className="auth-back-link mt-3">
          <span aria-hidden>←</span>
          <span>חזרה לדף הבית</span>
        </a>

        <form
          onSubmit={handleSubmit}
          className="site-card-padded mt-6 space-y-4 text-right"
        >
          <div>
            <label htmlFor={emailId} className="block text-xs font-medium text-neutral-600">
              אימייל
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              className="site-input mt-1"
              placeholder="name@example.com"
            />
          </div>
          <PasswordInput
            label="סיסמה"
            name="password"
            required
            autoComplete="current-password"
            inputClassName="site-input mt-0 pl-11 pr-3 text-right"
          />
          <TurnstileWidget
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
          />
          {error && <p className="text-xs text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? "מתחבר..." : "התחברות"}
          </button>
          <p className="text-xs text-neutral-600">
            שכחת סיסמה?{" "}
            <a
              href="/auth/forgot-password"
              className="font-semibold text-emerald-950 hover:underline"
            >
              איפוס סיסמה
            </a>
          </p>
          <p className="text-xs text-neutral-600">
            אין לך משתמש?{" "}
            <a
              href={
                afterLogin
                  ? `/auth/register?redirect=${encodeURIComponent(afterLogin)}`
                  : "/auth/register"
              }
              className="font-semibold text-emerald-950 hover:underline"
            >
              הרשמה
            </a>
          </p>
        </form>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="site-page px-4 py-12 text-center text-sm text-neutral-600">
          טוען...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
