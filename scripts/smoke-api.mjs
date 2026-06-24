/**
 * Smoke tests for API routes and security headers after deploy.
 * Usage: node scripts/smoke-api.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 */
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function req(path, opts = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    redirect: "manual",
    ...opts,
    headers: {
      ...(opts.headers || {}),
    },
  });
  let body = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    body = await res.text();
  }
  return { res, body };
}

async function main() {
  console.log(`\nSmoke API — ${base}\n`);

  // Health
  {
    const { res, body } = await req("/api/health");
    record(
      "GET /api/health",
      res.status === 200 || res.status === 503,
      `status=${res.status} ok=${body?.ok}`
    );
  }

  {
    const { res, body } = await req("/api/health/db");
    const noLeak = body == null || body.error === undefined;
    record(
      "GET /api/health/db (no error leak)",
      (res.status === 200 || res.status === 503) && noLeak,
      `status=${res.status} leaked=${!noLeak}`
    );
  }

  // Public APIs
  for (const path of [
    "/api/venues",
    "/api/venues/map",
    "/api/packages",
    "/api/services/public",
    "/api/trending",
  ]) {
    const { res, body } = await req(path);
    const ok = res.status === 200 && body != null;
    let detail = `status=${res.status}`;
    if (path === "/api/venues/map" && body?.venues) {
      detail += ` count=${body.venues.length}`;
    }
    record(`GET ${path}`, ok, detail);
  }

  // Security: same-origin guard on freelancer-availability
  {
    const { res } = await req("/api/inquiry/freelancer-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: "dj", label: "DJ" }] }),
    });
    record(
      "POST /api/inquiry/freelancer-availability (no Origin)",
      res.status === 403,
      `status=${res.status}`
    );
  }

  // Security: MAX_ITEMS cap (with Origin for localhost)
  {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      label: `Item ${i}`,
    }));
    const { res } = await req("/api/inquiry/freelancer-availability", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: base,
        Host: new URL(base).host,
      },
      body: JSON.stringify({ items }),
    });
    record(
      "POST /api/inquiry/freelancer-availability (20 items)",
      res.status === 400,
      `status=${res.status}`
    );
  }

  // Security: venue-owner role guard
  {
    const { res } = await req("/api/venue-owner/venues");
    record(
      "GET /api/venue-owner/venues (no session)",
      res.status === 401 || res.status === 403,
      `status=${res.status}`
    );
  }

  // CSP on page route (production only — middleware skips CSP in dev)
  {
    const { res } = await req("/");
    const csp = res.headers.get("content-security-policy") || "";
    const isProd = process.env.NODE_ENV === "production" || base.startsWith("https://");
    if (isProd) {
      const hasNonce = csp.includes("nonce-");
      const hasFrameSrc = csp.includes("frame-src");
      const noUnsafeEval = !csp.includes("unsafe-eval");
      record(
        "GET / CSP header",
        hasNonce && hasFrameSrc && noUnsafeEval,
        hasNonce
          ? `nonce ok, frame-src=${hasFrameSrc}`
          : `missing CSP (status=${res.status})`
      );
    } else {
      record(
        "GET / CSP header",
        res.status === 200,
        `dev mode — CSP skipped (status=${res.status})`
      );
    }
  }

  // Public pages return HTML 200
  const pages = [
    "/",
    "/halls",
    "/halls/map",
    "/halls?view=map",
    "/packages",
    "/providers",
    "/contact",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/privacy/request",
    "/trending",
    "/event-builder",
    "/favorites",
    "/cookies",
    "/accessibility",
    "/terms",
    "/privacy",
  ];
  for (const path of pages) {
    const { res } = await req(path);
    const ok = res.status >= 200 && res.status < 400;
    record(`GET ${path} (page)`, ok, `status=${res.status}`);
  }

  // Auth guards (no session)
  for (const [path, label] of [
    ["/api/admin/users", "admin API"],
    ["/api/freelancer/services", "freelancer API"],
    ["/api/my-inquiries", "seeker API"],
  ]) {
    const { res } = await req(path);
    record(
      `GET ${path} (no session)`,
      res.status === 401 || res.status === 403,
      `${label} status=${res.status}`
    );
  }

  // Optional auth smoke — set SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD in env (never commit)
  const testEmail = process.env.SMOKE_TEST_EMAIL?.trim();
  const testPassword = process.env.SMOKE_TEST_PASSWORD?.trim();
  if (testEmail && testPassword) {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginBody = await loginRes.json().catch(() => ({}));
    const setCookie = loginRes.headers.get("set-cookie") || "";
    record(
      "POST /api/auth/login",
      loginRes.status === 200,
      `status=${loginRes.status}`
    );

    if (loginRes.status === 200 && setCookie) {
      const cookie = setCookie.split(";")[0];
      const role = loginBody?.user?.role || "?";
      const authed = await req("/api/my-inquiries", {
        headers: { Cookie: cookie, Origin: base },
      });
      record(
        `GET /api/my-inquiries (${role})`,
        authed.res.status === 200 || authed.res.status === 403,
        `status=${authed.res.status}`
      );

      if (role === "VENUE_OWNER") {
        const venues = await req("/api/venue-owner/venues", {
          headers: { Cookie: cookie, Origin: base },
        });
        record(
          "GET /api/venue-owner/venues (authed)",
          venues.res.status === 200,
          `status=${venues.res.status}`
        );
      }
      if (role === "FREELANCER") {
        const svc = await req("/api/freelancer/services", {
          headers: { Cookie: cookie, Origin: base },
        });
        record(
          "GET /api/freelancer/services (authed)",
          svc.res.status === 200,
          `status=${svc.res.status}`
        );
      }
    }
  }

  // Venue detail page (first public venue if any)
  {
    const { body: venuesBody } = await req("/api/venues");
    const firstId = venuesBody?.venues?.[0]?.id;
    if (firstId) {
      const { res } = await req(`/halls/${firstId}`);
      record(`GET /halls/${firstId} (page)`, res.status === 200, `status=${res.status}`);
    } else {
      record("GET /halls/[id] (page)", true, "skipped — no venues in DB");
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n--- ${results.length - failed.length}/${results.length} passed ---\n`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
