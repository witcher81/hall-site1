/**
 * שולח FormData דרך XHR עם דיווחי התקדמות אמיתיים על העלאה.
 *
 * למה לא fetch? fetch לא חושף את `upload.onprogress` (אין תמיכה רחבה
 * ב-`ReadableStream` של גוף הבקשה ב-browsers נכון להיום), אז משתמשים ב-XHR
 * כדי לקבל אחוזי העלאה אמיתיים.
 */

export type XhrUploadOptions = {
  url: string;
  method?: "POST" | "PUT" | "PATCH";
  body: FormData;
  /** נקרא כל פעם שאחוז ההעלאה משתנה (0–100). */
  onUploadProgress?: (percent: number) => void;
  /** נקרא ברגע שכל הבייטים נשלחו, השרת עוד מעבד. */
  onUploadComplete?: () => void;
};

export type XhrUploadResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

export function xhrUpload<T = unknown>(
  opts: XhrUploadOptions
): Promise<XhrUploadResult<T>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opts.method ?? "POST", opts.url, true);

    if (xhr.upload && opts.onUploadProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          const pct = (e.loaded / e.total) * 100;
          opts.onUploadProgress!(pct);
        }
      };
    }
    if (xhr.upload && opts.onUploadComplete) {
      xhr.upload.onload = () => opts.onUploadComplete!();
    }

    xhr.onerror = () => {
      resolve({ ok: false, status: 0, data: null, error: "שגיאת רשת" });
    };
    xhr.onabort = () => {
      resolve({ ok: false, status: 0, data: null, error: "השליחה בוטלה" });
    };
    xhr.ontimeout = () => {
      resolve({ ok: false, status: 0, data: null, error: "פסק זמן בשליחה" });
    };

    xhr.onload = () => {
      let parsed: unknown = null;
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        parsed = null;
      }
      const ok = xhr.status >= 200 && xhr.status < 300;
      const err =
        !ok && parsed && typeof parsed === "object" && "error" in parsed
          ? String((parsed as { error?: unknown }).error ?? "")
          : null;
      resolve({
        ok,
        status: xhr.status,
        data: (parsed as T) ?? null,
        error: ok ? null : err || `שגיאת שרת (${xhr.status})`,
      });
    };

    xhr.send(opts.body);
  });
}
