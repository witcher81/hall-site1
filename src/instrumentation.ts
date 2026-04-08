/**
 * רץ בעת אתחול runtime של Node בפרודקשן — בודק טעויות נפוצות בחשיפת סודות.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertNoSecretExposedAsPublicEnv } = await import("./lib/env.server");
  assertNoSecretExposedAsPublicEnv();
}
