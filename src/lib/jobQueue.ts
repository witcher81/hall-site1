import "server-only";

import { prisma } from "@/lib/prisma";
import { executeJob } from "@/lib/jobHandlers";

const BATCH_PER_RUN = 15;

export type EnqueueOptions = {
  /** הרץ לא לפני התאריך (עיכוב) */
  runAfter?: Date;
  maxAttempts?: number;
};

/** הוספת משימה לתור — קריאה מקוד שרת בלבד */
export async function enqueueJob(
  type: string,
  payload?: unknown,
  opts?: EnqueueOptions
): Promise<{ id: number }> {
  const row = await prisma.backgroundJob.create({
    data: {
      type,
      payloadJson: payload != null ? JSON.stringify(payload) : null,
      runAfter: opts?.runAfter ?? null,
      maxAttempts: opts?.maxAttempts ?? 3,
    },
    select: { id: true },
  });
  return row;
}

async function claimNextJob() {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.backgroundJob.findFirst({
      where: {
        status: "PENDING",
        OR: [{ runAfter: null }, { runAfter: { lte: new Date() } }],
      },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) return null;

    const res = await tx.backgroundJob.updateMany({
      where: { id: candidate.id, status: "PENDING" },
      data: { status: "PROCESSING", attempts: { increment: 1 } },
    });
    if (res.count !== 1) return null;

    return tx.backgroundJob.findUniqueOrThrow({ where: { id: candidate.id } });
  });
}

/** מעבד עד BATCH_PER_RUN משימות — נקרא מ־Cron */
export async function processPendingJobs(): Promise<{
  processed: number;
  failed: number;
  retried: number;
}> {
  let processed = 0;
  let failed = 0;
  let retried = 0;

  for (let i = 0; i < BATCH_PER_RUN; i++) {
    const job = await claimNextJob();
    if (!job) break;

    let payload: unknown = null;
    if (job.payloadJson) {
      try {
        payload = JSON.parse(job.payloadJson) as unknown;
      } catch {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            lastError: "Invalid payload JSON",
            processedAt: new Date(),
          },
        });
        failed++;
        continue;
      }
    }

    try {
      await executeJob(job.type, payload);
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: { status: "DONE", lastError: null, processedAt: new Date() },
      });
      processed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (job.attempts >= job.maxAttempts) {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: { status: "FAILED", lastError: msg, processedAt: new Date() },
        });
        failed++;
      } else {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: { status: "PENDING", lastError: msg },
        });
        retried++;
      }
    }
  }

  return { processed, failed, retried };
}
