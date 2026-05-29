"use client";

import { useEffect, useMemo, useState } from "react";

export default function VenueAvailabilitySection({
  venueId,
  onDaySelect,
  calendarSelectNote,
  sectionClassName,
  disallowBookedPick = false,
}: {
  venueId: number;
  onDaySelect?: (ymd: string) => void;
  /** טקסט אחרי "לחיצה על יום עתידי" כש־onDaySelect מוגדר */
  calendarSelectNote?: string;
  sectionClassName?: string;
  /** בטופס פנייה — לא למלא תאריך שסומן BOOKED */
  disallowBookedPick?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<
    { date: string; status: "FREE" | "BOOKED" }[]
  >([]);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  /** תאריך שנבחר בלחיצה — ויזואלית בלבד */
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);

  const sectionCls =
    sectionClassName ??
    "mt-8 rounded-2xl border border-neutral-200 bg-white p-6 text-right text-sm shadow-sm";

  const availabilityMap = useMemo(() => {
    const map: Record<string, "FREE" | "BOOKED"> = {};
    for (const row of availability) map[row.date] = row.status;
    return map;
  }, [availability]);

  const todayYmd = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.year, visibleMonth.month, 1);
    const startWeekday = firstDay.getDay();
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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/availability`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "טעינת זמינות נכשלה");
        setLoading(false);
        return;
      }
      const list =
        data?.availability?.map((item: { date: string; status: string }) => ({
          date: String(item.date).slice(0, 10),
          status: item.status === "BOOKED" ? "BOOKED" : "FREE",
        })) ?? [];
      setAvailability(list);
    } catch {
      setError("שגיאה בלתי צפויה בטעינת זמינות");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  useEffect(() => {
    setSelectedYmd(null);
  }, [venueId]);

  const selectNote =
    calendarSelectNote ??
    "ממלאת את תאריך האירוע בטופס הבקשה למטה.";

  return (
    <section className={sectionCls}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-emerald-950">לוח זמינות</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">
            בעל האולם מעדכן תאריכים תפוסים; ימים ללא עדכון נחשבים{" "}
            <strong className="text-emerald-950">פנויים</strong> — כמו בלוח הניהול.
            {onDaySelect && (
              <>
                {" "}
                <strong className="text-emerald-950">לחיצה על יום עתידי</strong> {selectNote}
              </>
            )}
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
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-neutral-50"
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

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-neutral-800">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-emerald-400 bg-emerald-50" />
          פנוי
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-red-300 bg-red-50" />
          תפוס
        </span>
      </div>

      {loading ? (
        <p className="mt-4 text-xs text-neutral-600">טוען זמינות...</p>
      ) : error ? (
        <p className="mt-4 text-xs text-red-700">{error}</p>
      ) : (
        <div className="mt-4 overflow-x-auto" dir="ltr">
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
                      className="min-h-[4.5rem] rounded-lg border border-transparent sm:min-h-[5rem]"
                    />
                  );
                }
                const isPast = cell.date < todayYmd;
                if (isPast) {
                  return (
                    <div
                      key={cell.date}
                      className="flex min-h-[4.5rem] flex-col items-center justify-center rounded-lg border border-[#EDE6DB] bg-[#F8F6F2] sm:min-h-[5rem]"
                    >
                      <span className="text-sm font-medium text-[#B0A99A]">{cell.day}</span>
                      <span className="mt-0.5 text-[9px] text-[#C4BDB0]">עבר</span>
                    </div>
                  );
                }
                const status = availabilityMap[cell.date] ?? "FREE";
                const canPick = Boolean(onDaySelect);
                const isSelected = selectedYmd === cell.date;
                const cellClass = `flex min-h-[4.5rem] flex-col justify-between rounded-lg border p-1.5 sm:min-h-[5rem] sm:p-2 ${
                  status === "BOOKED"
                    ? "border-red-300 bg-red-50"
                    : "border-emerald-300 bg-emerald-50"
                } ${
                  isSelected
                    ? "z-[1] ring-2 ring-amber-400 ring-offset-2 ring-offset-[#FAF8F4] shadow-md"
                    : ""
                }`;
                const label = new Date(`${cell.date}T12:00:00`).toLocaleDateString("he-IL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                if (canPick) {
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => {
                        if (disallowBookedPick && status === "BOOKED") return;
                        setSelectedYmd(cell.date);
                        onDaySelect?.(cell.date);
                      }}
                      disabled={disallowBookedPick && status === "BOOKED"}
                      className={`${cellClass} w-full text-right transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        disallowBookedPick && status === "BOOKED"
                          ? "cursor-not-allowed opacity-80"
                          : "cursor-pointer hover:ring-2 hover:ring-amber-400/50"
                      }`}
                      aria-label={`בחירת ${label} לבקשה`}
                      aria-pressed={isSelected}
                    >
                      <span className="text-sm font-semibold text-neutral-900">{cell.day}</span>
                      <span className="text-[10px] font-medium leading-tight sm:text-[11px]">
                        {status === "BOOKED" ? (
                          <span className="text-red-800">תפוס</span>
                        ) : (
                          <span className="text-emerald-900">פנוי</span>
                        )}
                      </span>
                    </button>
                  );
                }
                return (
                  <div key={cell.date} className={cellClass}>
                    <span className="text-sm font-semibold text-neutral-900">{cell.day}</span>
                    <span className="text-[10px] font-medium leading-tight sm:text-[11px]">
                      {status === "BOOKED" ? (
                        <span className="text-red-800">תפוס</span>
                      ) : (
                        <span className="text-emerald-900">פנוי</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && availability.length > 0 && (
        <div className="mt-4 border-t border-[#E8E0D4] pt-3">
          <p className="mb-2 text-[11px] font-semibold text-emerald-950">רשימה מהירה</p>
          <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs">
            {availability.map((row) => (
              <li key={row.date}>
                {onDaySelect ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (disallowBookedPick && row.status === "BOOKED") return;
                      setSelectedYmd(row.date);
                      onDaySelect(row.date);
                    }}
                    disabled={disallowBookedPick && row.status === "BOOKED"}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-right transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      disallowBookedPick && row.status === "BOOKED"
                        ? "cursor-not-allowed opacity-70"
                        : "hover:bg-[#EDE4D4]"
                    } ${
                      selectedYmd === row.date
                        ? "border-[#C9A227] bg-[#FFF9E6] ring-2 ring-amber-400/60"
                        : "border-neutral-200 bg-[#F5EFE3]"
                    }`}
                  >
                    <span className="text-neutral-800">
                      {new Date(`${row.date}T00:00:00`).toLocaleDateString("he-IL")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        row.status === "BOOKED"
                          ? "bg-red-100 text-red-900"
                          : "bg-emerald-100 text-emerald-950"
                      }`}
                    >
                      {row.status === "BOOKED" ? "תפוס" : "פנוי"}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-[#F5EFE3] px-3 py-1.5">
                    <span className="text-neutral-800">
                      {new Date(`${row.date}T00:00:00`).toLocaleDateString("he-IL")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        row.status === "BOOKED"
                          ? "bg-red-100 text-red-900"
                          : "bg-emerald-100 text-emerald-950"
                      }`}
                    >
                      {row.status === "BOOKED" ? "תפוס" : "פנוי"}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
