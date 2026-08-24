/**
 * RFC 9457-ish problem details + stable error codes for public API agents.
 */

export type ApiProblem = {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  instance?: string;
  hint?: string;
};

export function problemJson(
  status: number,
  code: string,
  title: string,
  detail: string,
  hint?: string,
  instance?: string
): ApiProblem {
  return {
    type: `https://hall-site1.vercel.app/developers#error-${code}`,
    title,
    status,
    detail,
    code,
    ...(hint ? { hint } : {}),
    ...(instance ? { instance } : {}),
  };
}

export function problemResponse(
  status: number,
  code: string,
  title: string,
  detail: string,
  hint?: string,
  headers?: HeadersInit
): Response {
  const body = problemJson(status, code, title, detail, hint);
  return Response.json(body, {
    status,
    headers: {
      "Content-Type": "application/problem+json; charset=utf-8",
      ...headers,
    },
  });
}
