import "server-only";

/**
 * תור הודעות של האתר — מגובה בטבלת `BackgroundJob` ב־Postgres.
 * Worker: `GET /api/cron/process-jobs` (Vercel Cron) + ניסיונות `consumeQueueBatch` מיידיים אחרי פעולות חשובות.
 */
import {
  enqueueJob,
  processPendingJobs,
  type EnqueueOptions,
} from "@/lib/jobQueue";

export type { EnqueueOptions };

/** פרסום הודעה לתור (FIFO לפי `createdAt`). */
export async function publishMessage(
  messageType: string,
  body?: unknown,
  opts?: EnqueueOptions
): Promise<{ id: number }> {
  return enqueueJob(messageType, body, opts);
}

/** מעבד עד מגבלת האצווה הפנימית — להרצה מ־Cron או kick לאחר publish. */
export async function consumeQueueBatch(): Promise<{
  processed: number;
  failed: number;
  retried: number;
}> {
  return processPendingJobs();
}
