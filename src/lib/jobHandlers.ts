import "server-only";

/**
 * מטפלי משימות לפי `type`. הוסף כאן case חדש לכל סוג עבודה רקע.
 */
export async function executeJob(jobType: string, payload: unknown): Promise<void> {
  switch (jobType) {
    case "noop":
      return;
    case "log":
      console.log("[BackgroundJob log]", payload);
      return;
    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}
