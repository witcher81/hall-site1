"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ListingPromoBadges from "@/components/ListingPromoBadges";
import {
  VENUE_BOOST_DAYS,
  VENUE_BOOST_PRICE_NIS,
} from "@/lib/venueBoostConfig";

type Venue = {
  id: number;
  name: string;
  city: string;
  address: string;
  minGuests: number | null;
  maxGuests: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  hallRentalMin: number | null;
  hallRentalMax: number | null;
  description: string | null;
  coverImageUrl?: string | null;
  galleryImageUrls?: string[] | null;
  boostExpiresAt?: string | null;
};

export default function VenueDetailsClient({
  initialVenue,
  boostPurchaseEnabled,
  boostStripeEnabled = false,
  boostDemoEnabled = false,
}: {
  initialVenue: Venue;
  boostPurchaseEnabled: boolean;
  boostStripeEnabled?: boolean;
  boostDemoEnabled?: boolean;
}) {
  const router = useRouter();
  const [venue] = useState(initialVenue);
  const [boostExpiresAt, setBoostExpiresAt] = useState<string | null>(
    initialVenue.boostExpiresAt ?? null
  );
  const [boosting, setBoosting] = useState(false);
  const [boostError, setBoostError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [availability, setAvailability] = useState<
    { id: number; date: string; status: "FREE" | "BOOKED" }[]
  >([]);
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>({});
  const [approvedInquiryCounts, setApprovedInquiryCounts] = useState<
    Record<string, number>
  >({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDateInput, setSelectedDateInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"FREE" | "BOOKED">("FREE");
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const allImageUrls = useMemo(() => {
    const urls: string[] = [];
    if (venue.coverImageUrl) urls.push(venue.coverImageUrl);
    if (venue.galleryImageUrls?.length) urls.push(...venue.galleryImageUrls);
    return urls;
  }, [venue.coverImageUrl, venue.galleryImageUrls]);

  const availabilityMap = useMemo(() => {
    const map: Record<string, "FREE" | "BOOKED"> = {};
    for (const row of availability) map[row.date] = row.status;
    return map;
  }, [availability]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.year, visibleMonth.month, 1);
    const startWeekday = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(visibleMonth.year, visibleMonth.month + 1, 0).getDate();
    const days: Array<{ date: string; day: number; inMonth: boolean }> = [];

    for (let i = 0; i < startWeekday; i += 1) {
      days.push({ date: "", day: 0, inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const d = new Date(visibleMonth.year, visibleMonth.month, day);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({ date: ymd, day, inMonth: true });
    }
    while (days.length % 7 !== 0) {
      days.push({ date: "", day: 0, inMonth: false });
    }
    return days;
  }, [visibleMonth.year, visibleMonth.month]);

  const todayYmd = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const canGoToPreviousMonth = useMemo(() => {
    const now = new Date();
    const nowKey = now.getFullYear() * 12 + now.getMonth();
    const visibleKey = visibleMonth.year * 12 + visibleMonth.month;
    return visibleKey > nowKey;
  }, [visibleMonth.month, visibleMonth.year]);

  /** ברירת מחדל ללא רשומה ב־DB = פנוי */
  const selectedDateStatus = useMemo((): "FREE" | "BOOKED" | null => {
    if (!selectedDate || selectedDate < todayYmd) return null;
    return availabilityMap[selectedDate] ?? "FREE";
  }, [selectedDate, todayYmd, availabilityMap]);

  const canMarkBooked =
    selectedDateStatus === "FREE" && !savingAvailability;
  const canMarkFree =
    selectedDateStatus === "BOOKED" && !savingAvailability;

  async function loadAvailability() {
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      const res = await fetch(`/api/venue-owner/venues/${venue.id}/availability`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAvailabilityError(data?.error || "טעינת זמינות נכשלה");
        setAvailabilityLoading(false);
        return;
      }
      const rows =
        data?.availability?.map((row: { id: number; date: string; status: string }) => ({
          id: row.id,
          date: String(row.date).slice(0, 10),
          status: row.status === "BOOKED" ? "BOOKED" : "FREE",
        })) ?? [];
      setAvailability(rows);
      setInquiryCounts(data?.inquiryCounts ?? {});
      setApprovedInquiryCounts(data?.approvedInquiryCounts ?? {});
    } catch {
      setAvailabilityError("שגיאה בלתי צפויה בטעינת זמינות");
    } finally {
      setAvailabilityLoading(false);
    }
  }

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue.id]);

  async function saveAvailabilityDate(statusOverride?: "FREE" | "BOOKED") {
    if (!selectedDate) return;
    setSavingAvailability(true);
    setAvailabilityError(null);
    try {
      const statusToSave = statusOverride ?? selectedStatus;
      const res = await fetch(`/api/venue-owner/venues/${venue.id}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, status: statusToSave }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAvailabilityError(data?.error || "שמירה נכשלה");
        setSavingAvailability(false);
        return;
      }
      setSelectedDate("");
      setSelectedDateInput("");
      await loadAvailability();
    } catch {
      setAvailabilityError("שגיאה בלתי צפויה בשמירה");
    } finally {
      setSavingAvailability(false);
    }
  }

  async function removeAvailabilityDate(date: string) {
    setSavingAvailability(true);
    setAvailabilityError(null);
    try {
      const res = await fetch(
        `/api/venue-owner/venues/${venue.id}/availability?date=${encodeURIComponent(date)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAvailabilityError(data?.error || "מחיקת תאריך נכשלה");
        setSavingAvailability(false);
        return;
      }
      await loadAvailability();
    } catch {
      setAvailabilityError("שגיאה בלתי צפויה במחיקה");
    } finally {
      setSavingAvailability(false);
    }
  }

  function parseDmyToYmd(value: string) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);
    const dt = new Date(year, month - 1, day);
    if (
      dt.getFullYear() !== year ||
      dt.getMonth() !== month - 1 ||
      dt.getDate() !== day
    ) {
      return null;
    }
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatYmdToDmy(value: string) {
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "";
    return `${day}/${month}/${year}`;
  }

  function applyDateMask(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const chars = ["d", "d", "/", "m", "m", "/", "y", "y", "y", "y"];
    const mapIdx = [0, 1, 3, 4, 6, 7, 8, 9];
    for (let i = 0; i < digits.length; i += 1) {
      chars[mapIdx[i]] = digits[i];
    }
    return chars.join("");
  }

  const openLightbox = (index: number) => {
    if (index >= 0 && index < allImageUrls.length) setLightboxIndex(index);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? allImageUrls.length - 1 : lightboxIndex - 1);
  };

  const goNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === allImageUrls.length - 1 ? 0 : lightboxIndex + 1);
  };

  const boostActive = useMemo(() => {
    if (!boostExpiresAt) return false;
    return new Date(boostExpiresAt) > new Date();
  }, [boostExpiresAt]);

  async function handleBoost() {
    setBoosting(true);
    setBoostError(null);
    try {
      if (boostStripeEnabled) {
        const res = await fetch("/api/venue-owner/venues/boost/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId: venue.id }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.url) {
          setBoostError(data?.error || "פתיחת תשלום נכשלה");
          setBoosting(false);
          return;
        }
        window.location.assign(data.url as string);
        return;
      }
      const res = await fetch("/api/venue-owner/venues/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: venue.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBoostError(data?.error || "הקידום נכשל");
        setBoosting(false);
        return;
      }
      if (typeof data?.boostExpiresAt === "string") {
        setBoostExpiresAt(data.boostExpiresAt);
      }
      router.refresh();
    } catch {
      setBoostError("שגיאה בלתי צפויה");
    } finally {
      setBoosting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/venue-owner/venues?id=${venue.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "מחיקת האולם נכשלה");
        setDeleting(false);
        return;
      }

      router.push("/dashboard/venue-owner");
      router.refresh();
    } catch {
      setError("שגיאה בלתי צפויה");
      setDeleting(false);
    }
  }

  return (
    <div className="pb-4 text-neutral-900">
      {/* הירו במותג – כמו דף הבית */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-950 to-emerald-900 text-white shadow-[0_20px_50px_rgba(15,59,46,0.28)]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[11px] font-semibold tracking-[0.28em] text-amber-600">
                ניהול אולם
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{venue.name}</h1>
              <p className="mt-2 text-sm leading-relaxed text-[#F8F6F0]/95">
                {venue.city} · {venue.address}
              </p>
              <a
                href={`/halls/${venue.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-400 transition hover:text-white"
              >
                צפייה בדף הציבורי (כמו שמחפשים רואים)
                <span aria-hidden className="text-lg leading-none">
                  ↗
                </span>
              </a>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:shrink-0">
              <a
                href={`/dashboard/venue-owner/venues/${venue.id}/edit`}
                className="inline-flex justify-center rounded-full bg-amber-400 px-6 py-2.5 text-center text-sm font-semibold text-neutral-950 shadow-[0_10px_28px_rgba(0,0,0,0.25)] transition hover:bg-amber-300"
              >
                עריכת אולם
              </a>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex justify-center rounded-full border border-red-200/60 bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                מחיקת אולם
              </button>
              <a
                href="/dashboard/venue-owner"
                className="inline-flex justify-center rounded-full border border-white/35 px-5 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/10"
              >
                חזרה לאולמות שלי
              </a>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 space-y-3 rounded-2xl border border-[#C9A227]/35 bg-gradient-to-br from-[#FFF9E6] to-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
        <div className="mb-2 h-1 w-12 rounded-full bg-amber-400" aria-hidden />
        <h2 className="text-lg font-semibold text-emerald-950">קידום בחיפוש</h2>
        <p className="text-xs leading-relaxed text-[#5C564C]">
          הקפצת האולם לראש רשימת תוצאות החיפוש + תג «מאומת» למשך {VENUE_BOOST_DAYS} ימים
          {boostStripeEnabled ? (
            <>
              . תשלום מאובטח דרך Stripe.
            </>
          ) : boostDemoEnabled ? (
            <>
              . התשלום כאן הוא{" "}
              <span className="font-medium text-emerald-950">דמו בלבד</span> (ללא סליקה אמיתית).
            </>
          ) : (
            <>
              . <span className="font-medium text-emerald-950">רכישת קידום תיפתח בקרוב</span>.
            </>
          )}
        </p>
        {boostActive ? (
          <div className="flex flex-wrap items-center gap-2">
            <ListingPromoBadges active />
            {boostExpiresAt ? (
              <p className="text-xs font-medium text-emerald-950">
                פעיל עד{" "}
                {new Date(boostExpiresAt).toLocaleString("he-IL", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
          </div>
        ) : null}
        {boostPurchaseEnabled ? (
          <button
            type="button"
            onClick={handleBoost}
            disabled={boosting}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-amber-300 disabled:opacity-60"
          >
            {boosting
              ? "מעבד..."
              : boostActive
                ? `הארך קידום — ₪${VENUE_BOOST_PRICE_NIS}${boostDemoEnabled ? " (דמו)" : ""}`
                : `קדם את האולם — ₪${VENUE_BOOST_PRICE_NIS}${boostDemoEnabled ? " (דמו)" : ""}`}
          </button>
        ) : (
          <p className="mt-1 text-xs text-neutral-600">
            כשהקידום יהיה זמין תוכלו לרכוש כאן. קידום קיים (אם יש) ימשיך עד תאריך הסיום.
          </p>
        )}
        {boostError && (
          <p className="text-xs text-red-600" role="alert">
            {boostError}
          </p>
        )}
      </section>

      <section className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
          {venue.coverImageUrl && (
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="mb-2 block w-full overflow-hidden rounded-xl border border-neutral-200 text-right focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={venue.coverImageUrl}
                alt={venue.name}
                className="h-56 w-full cursor-pointer object-cover transition hover:opacity-95"
              />
            </button>
          )}

          {(venue.minGuests != null || venue.maxGuests != null) && (
            <p className="text-neutral-800">
              <span className="font-semibold text-emerald-950">קיבולת אורחים: </span>
              {venue.minGuests ?? "?"}–{venue.maxGuests ?? "?"} אורחים
            </p>
          )}

          {(venue.minPrice != null || venue.maxPrice != null) && (
            <p className="text-neutral-800">
              <span className="font-semibold text-emerald-950">טווח מחירים למנה: </span>
              {venue.minPrice ?? "?"}–{venue.maxPrice ?? "?"} ₪
            </p>
          )}

          {(venue.hallRentalMin != null || venue.hallRentalMax != null) && (
            <p className="text-neutral-800">
              <span className="font-semibold text-emerald-950">השכרת אולם (לאירוע): </span>
              {venue.hallRentalMin ?? "?"}–{venue.hallRentalMax ?? "?"} ₪
            </p>
          )}

          {venue.description && (
            <p className="text-neutral-800">
              <span className="font-semibold text-emerald-950">תיאור על האולם: </span>
              <span className="text-neutral-600">{venue.description}</span>
            </p>
          )}

          {!venue.description &&
            venue.minGuests == null &&
            venue.maxGuests == null &&
            venue.minPrice == null &&
            venue.maxPrice == null &&
            venue.hallRentalMin == null &&
            venue.hallRentalMax == null && (
              <p className="text-xs text-neutral-600">
                עדיין לא הזנת פרטים מורחבים על האולם.
              </p>
            )}

          {venue.galleryImageUrls && venue.galleryImageUrls.length > 0 && (
            <div className="pt-3">
              <p className="mb-2 text-xs font-semibold text-emerald-950">
                גלריית תמונות (לחץ לצפייה):
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {venue.galleryImageUrls.map((url, idx) => {
                  const imageIndex = venue.coverImageUrl ? idx + 1 : idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => openLightbox(imageIndex)}
                      className="overflow-hidden rounded-lg border border-neutral-200 text-right focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${venue.name} תמונה ${idx + 1}`}
                        className="h-24 w-full cursor-pointer object-cover transition hover:opacity-95"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="mt-8 space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.06)] ring-1 ring-[#0F3B2E]/[0.06]">
          <div className="flex flex-col gap-4 border-b border-[#E8E0D4] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-right">
              <div className="mb-2 h-1 w-12 rounded-full bg-amber-400" aria-hidden />
              <h2 className="text-lg font-semibold text-emerald-950">לוח זמינות ופניות</h2>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#5C564C]">
                ימים ללא עדכון נחשבים <strong className="text-emerald-950">פנויים</strong>.{" "}
                <strong className="text-emerald-950">סימון תפוס</strong> זמין רק ביום שמוצג כפנוי;{" "}
                <strong className="text-emerald-950">סימון פנוי</strong> רק כשהיום מסומן כתפוס. מספר הפניות
                מוצג לכל יום שבו הגיעו בקשות.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2" dir="ltr">
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth((m) => {
                    const prevMonth = m.month === 0 ? 11 : m.month - 1;
                    const prevYear = m.month === 0 ? m.year - 1 : m.year;
                    return { year: prevYear, month: prevMonth };
                  })
                }
                disabled={!canGoToPreviousMonth}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-neutral-50 disabled:opacity-50"
              >
                חודש קודם
              </button>
              <span className="min-w-[10rem] text-center text-xs font-semibold text-emerald-950">
                {new Date(visibleMonth.year, visibleMonth.month, 1).toLocaleDateString("he-IL", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth((m) => {
                    const nextMonth = m.month === 11 ? 0 : m.month + 1;
                    const nextYear = m.month === 11 ? m.year + 1 : m.year;
                    return { year: nextYear, month: nextMonth };
                  })
                }
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-neutral-50"
              >
                חודש הבא
              </button>
            </div>
          </div>

          <div className="overflow-x-auto" dir="ltr">
            <div className="min-w-[280px]">
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-neutral-600 sm:gap-2">
                {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((cell, idx) => {
                  if (!cell.inMonth) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[5.25rem] rounded-lg border border-transparent bg-transparent sm:min-h-[5.5rem]"
                      />
                    );
                  }
                  const isPast = cell.date < todayYmd;
                  if (isPast) {
                    return (
                      <div
                        key={cell.date}
                        className="flex min-h-[5.25rem] flex-col items-center justify-center rounded-lg border border-[#EDE6DB] bg-[#F8F6F2] sm:min-h-[5.5rem]"
                      >
                        <span className="text-sm font-medium text-[#B0A99A]">{cell.day}</span>
                        <span className="mt-1 text-[10px] text-[#C4BDB0]">עבר</span>
                      </div>
                    );
                  }
                  const status = availabilityMap[cell.date] ?? "FREE";
                  const count = inquiryCounts[cell.date] ?? 0;
                  const approvedCount = approvedInquiryCounts[cell.date] ?? 0;
                  const isSelected = selectedDate === cell.date;
                  const tone =
                    status === "BOOKED"
                      ? "border-red-200 bg-gradient-to-b from-red-50 to-red-100/80"
                      : "border-emerald-200 bg-gradient-to-b from-emerald-50 to-[#E8F5EE]";
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(cell.date);
                        setSelectedDateInput(formatYmdToDmy(cell.date));
                      }}
                      className={`flex min-h-[5.25rem] flex-col rounded-xl border-2 p-1.5 text-right shadow-sm transition hover:border-amber-400 hover:shadow-md sm:min-h-[5.5rem] sm:p-2 ${tone} ${isSelected ? "ring-2 ring-amber-400 ring-offset-2" : ""}`}
                    >
                      <div className="flex w-full items-start justify-between gap-1">
                        <span className="text-base font-bold tabular-nums text-neutral-900">{cell.day}</span>
                        {count > 0 && (
                          <span
                            className="shrink-0 rounded-full bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm sm:text-[11px]"
                            title={`${count} פניות${approvedCount > 0 ? ` · ${approvedCount} אושרו` : ""}`}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                      <div className="mt-auto border-t border-black/[0.06] pt-1.5 text-center">
                        {status === "BOOKED" ? (
                          <span className="text-xs font-bold tracking-wide text-[#9B1C1C]">
                            תפוס{approvedCount > 0 ? " · אושר" : ""}
                          </span>
                        ) : (
                          <span className="text-xs font-bold tracking-wide text-emerald-950">פנוי</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="text"
              dir="ltr"
              inputMode="numeric"
              value={selectedDateInput || "dd/mm/yyyy"}
              onChange={(e) => {
                const next = e.target.value;
                const currentDigits = selectedDateInput.replace(/\D/g, "").slice(0, 8);
                let digits = next.replace(/\D/g, "").slice(0, 8);

                // אם נמחק תו תבנית (d/m/y או /), נמחוק בפועל ספרה אחת מהסוף
                if (
                  next.length < selectedDateInput.length &&
                  digits === currentDigits &&
                  currentDigits.length > 0
                ) {
                  digits = currentDigits.slice(0, -1);
                }

                const masked = applyDateMask(digits);
                setSelectedDateInput(masked);

                if (digits.length < 8) {
                  setSelectedDate("");
                  return;
                }

                const full = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
                const parsed = parseDmyToYmd(full);
                if (parsed && parsed >= todayYmd) {
                  setSelectedDate(parsed);
                } else {
                  setSelectedDate("");
                }
              }}
              onFocus={() => {
                if (!selectedDateInput) setSelectedDateInput("dd/mm/yyyy");
                requestAnimationFrame(() => {
                  const el = document.activeElement as HTMLInputElement | null;
                  el?.select();
                });
              }}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={async () => {
                setSelectedStatus("FREE");
                await saveAvailabilityDate("FREE");
              }}
              disabled={!canMarkFree}
              title={
                selectedDateStatus === "FREE"
                  ? "היום כבר פנוי (ברירת מחדל) — אין מה לסמן"
                  : selectedDateStatus === "BOOKED"
                    ? "מסמן את היום כפנוי"
                    : "בחרו תאריך עתידי בלוח"
              }
              className="rounded-full bg-emerald-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900 disabled:pointer-events-none disabled:opacity-40"
            >
              סימון פנוי
            </button>
            <button
              type="button"
              onClick={async () => {
                setSelectedStatus("BOOKED");
                await saveAvailabilityDate("BOOKED");
              }}
              disabled={!canMarkBooked}
              title={
                selectedDateStatus === "BOOKED"
                  ? "היום כבר תפוס — השתמשו ב״סימון פנוי״ כדי לשחרר"
                  : selectedDateStatus === "FREE"
                    ? "מסמן את היום כתפוס"
                    : "בחרו תאריך עתידי בלוח"
              }
              className="rounded-full bg-red-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-600 disabled:pointer-events-none disabled:opacity-40"
            >
              סימון תפוס
            </button>
          </div>

          {availabilityError && <p className="text-xs text-red-700">{availabilityError}</p>}
          {availabilityLoading && <p className="text-xs text-neutral-600">טוען זמינות...</p>}
        </section>

        {confirmingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 text-right text-sm shadow-xl">
              <h2 className="text-base font-semibold text-emerald-950">
                למחוק את האולם?
              </h2>
              <p className="mt-1 text-xs text-neutral-600">
                פעולה זו תמחק לצמיתות את האולם
                <span className="font-semibold text-neutral-900"> "{venue.name}" </span>
                מהרשימה שלך. לא ניתן לבטל לאחר המחיקה.
              </p>

              <div className="mt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                  disabled={deleting}
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {deleting ? "מוחק..." : "אישור מחיקה"}
                </button>
              </div>
            </div>
          </div>
        )}

        {lightboxIndex !== null && allImageUrls.length > 0 && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
            role="dialog"
            aria-modal="true"
            aria-label="תצוגת תמונה"
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute left-4 top-4 rounded-full bg-slate-800/80 p-2 text-slate-100 transition hover:bg-slate-700"
              aria-label="סגור"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {allImageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/80 text-slate-100 transition hover:bg-slate-700"
                  aria-label="תמונה קודמת"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/80 text-slate-100 transition hover:bg-slate-700"
                  aria-label="תמונה הבאה"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            <div
              className="flex max-h-[85vh] max-w-[90vw] items-center justify-center px-14"
              onClick={closeLightbox}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={allImageUrls[lightboxIndex]}
                alt={`${venue.name} תמונה ${lightboxIndex + 1}`}
                className="max-h-[85vh] max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-800/80 px-4 py-2 text-sm text-slate-200">
              {lightboxIndex + 1} / {allImageUrls.length}
            </p>
          </div>
        )}
    </div>
  );
}

