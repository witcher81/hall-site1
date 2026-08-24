import { describe, expect, it } from "vitest";
import { problemJson, problemResponse } from "@/lib/apiProblem";

describe("apiProblem", () => {
  it("builds typed problem objects with code and hint", () => {
    const p = problemJson(
      405,
      "method_not_allowed",
      "Method Not Allowed",
      "POST is not supported",
      "Use GET instead"
    );
    expect(p.status).toBe(405);
    expect(p.code).toBe("method_not_allowed");
    expect(p.hint).toBe("Use GET instead");
    expect(p.type).toContain("method_not_allowed");
  });

  it("returns application/problem+json responses", async () => {
    const res = problemResponse(
      400,
      "bad_request",
      "Bad Request",
      "Invalid query"
    );
    expect(res.status).toBe(400);
    expect(res.headers.get("Content-Type")).toContain("application/problem+json");
    const body = await res.json();
    expect(body.code).toBe("bad_request");
    expect(body.title).toBe("Bad Request");
  });
});
