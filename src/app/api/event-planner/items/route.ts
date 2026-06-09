import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const PLAN_TITLE = "__checklist_items__";

type Row = { id: string; label: string; done: boolean };

function parseItems(raw: string | null): Row[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as { items?: unknown };
    if (!Array.isArray(data.items)) return [];
    return data.items.filter(
      (x): x is Row =>
        x &&
        typeof x === "object" &&
        typeof (x as Row).id === "string" &&
        typeof (x as Row).label === "string" &&
        typeof (x as Row).done === "boolean"
    );
  } catch {
    return [];
  }
}

async function getOrCreatePlan(userId: number) {
  let plan = await prisma.eventPlan.findFirst({
    where: { userId, title: PLAN_TITLE },
    select: { id: true, notes: true },
  });
  if (!plan) {
    plan = await prisma.eventPlan.create({
      data: {
        userId,
        eventType: "חתונה",
        title: PLAN_TITLE,
        notes: JSON.stringify({ items: [] }),
      },
      select: { id: true, notes: true },
    });
  }
  return plan;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plan = await getOrCreatePlan(user.id);
  return NextResponse.json({ items: parseItems(plan.notes) });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  const sanitized: Row[] = [];
  for (const x of items) {
    if (
      x &&
      typeof x === "object" &&
      typeof (x as Row).id === "string" &&
      typeof (x as Row).label === "string" &&
      typeof (x as Row).done === "boolean"
    ) {
      const r = x as Row;
      sanitized.push({
        id: r.id,
        label: r.label.trim().slice(0, 200),
        done: r.done,
      });
    }
    if (sanitized.length >= 100) break;
  }

  const plan = await getOrCreatePlan(user.id);
  await prisma.eventPlan.update({
    where: { id: plan.id },
    data: { notes: JSON.stringify({ items: sanitized }) },
  });

  return NextResponse.json({ ok: true });
}
