import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_INPUT_MAX, badRequest } from "@/lib/userInputValidation";

export const runtime = "nodejs";

const ALLOWED_EVENT_TYPES = new Set(["חתונה", "בר מצווה"]);
const ALLOWED_CHECKLIST = new Set(["todo", "in_progress", "done"]);
type ChecklistState = "todo" | "in_progress" | "done";

function pickChecklistState(
  src: Record<string, unknown>,
  k: string
): ChecklistState {
  return typeof src[k] === "string" && ALLOWED_CHECKLIST.has(src[k] as string)
    ? (src[k] as ChecklistState)
    : "todo";
}

function parseChecklist(input: unknown): string {
  const src = (input ?? {}) as Record<string, unknown>;
  return JSON.stringify({
    venue: pickChecklistState(src, "venue"),
    photographer: pickChecklistState(src, "photographer"),
    dj: pickChecklistState(src, "dj"),
    catering: pickChecklistState(src, "catering"),
  });
}

function checklistObjectFromJson(raw: string | null): Record<string, ChecklistState> {
  const base: Record<string, ChecklistState> = {
    venue: "todo",
    photographer: "todo",
    dj: "todo",
    catering: "todo",
  };
  if (!raw) return base;
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    (["venue", "photographer", "dj", "catering"] as const).forEach((k) => {
      if (typeof p[k] === "string" && ALLOWED_CHECKLIST.has(p[k] as string)) {
        base[k] = p[k] as ChecklistState;
      }
    });
  } catch {
    /* ignore */
  }
  return base;
}

function toOptionalId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function validateEventPlanTextFields(
  title: string | null,
  notes: string | null,
  area: string | null,
  eventDate: string | null
): NextResponse | null {
  if (title && title.length > USER_INPUT_MAX.EVENT_PLAN_TITLE) {
    return badRequest("כותרת ארוכה מדי");
  }
  if (notes && notes.length > USER_INPUT_MAX.EVENT_PLAN_NOTES) {
    return badRequest("הערות ארוכות מדי");
  }
  if (area && area.length > USER_INPUT_MAX.AREA) {
    return badRequest("שדה אזור ארוך מדי");
  }
  if (eventDate && eventDate.length > USER_INPUT_MAX.DATE_STRING) {
    return badRequest("תאריך לא תקין");
  }
  return null;
}

async function validateServiceCategory(
  serviceId: number | null,
  category: string
): Promise<boolean> {
  if (serviceId === null) return true;
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, category: true },
  });
  return Boolean(service && service.category === category);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plans = await prisma.eventPlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      venue: { select: { id: true, name: true, city: true } },
      photographerService: { select: { id: true, name: true } },
      djService: { select: { id: true, name: true } },
      cateringService: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: "סוג אירוע לא תקין" }, { status: 400 });
  }

  const venueId = toOptionalId(body.venueId);
  const photographerServiceId = toOptionalId(body.photographerServiceId);
  const djServiceId = toOptionalId(body.djServiceId);
  const cateringServiceId = toOptionalId(body.cateringServiceId);
  const title = typeof body.title === "string" ? body.title.trim() || null : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const eventDate =
    typeof body.eventDate === "string" ? body.eventDate.trim() || null : null;
  const area = typeof body.area === "string" ? body.area.trim() || null : null;
  const budgetMin = toOptionalId(body.budgetMin);
  const budgetMax = toOptionalId(body.budgetMax);
  const checklistJson = parseChecklist(body.checklist);

  const textErr = validateEventPlanTextFields(title, notes, area, eventDate);
  if (textErr) return textErr;

  if (venueId !== null) {
    const v = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
    if (!v) return NextResponse.json({ error: "אולם לא נמצא" }, { status: 400 });
  }
  if (!(await validateServiceCategory(photographerServiceId, "צילום"))) {
    return NextResponse.json({ error: "יש לבחור שירות צילום תקין" }, { status: 400 });
  }
  if (!(await validateServiceCategory(djServiceId, "DJ"))) {
    return NextResponse.json({ error: "יש לבחור שירות DJ תקין" }, { status: 400 });
  }
  if (!(await validateServiceCategory(cateringServiceId, "קייטרינג"))) {
    return NextResponse.json({ error: "יש לבחור שירות קייטרינג תקין" }, { status: 400 });
  }

  const plan = await prisma.eventPlan.create({
    data: {
      userId: user.id,
      eventType,
      title,
      eventDate,
      area,
      budgetMin,
      budgetMax,
      checklistJson,
      venueId,
      photographerServiceId,
      djServiceId,
      cateringServiceId,
      notes,
    },
    include: {
      venue: { select: { id: true, name: true, city: true } },
      photographerService: { select: { id: true, name: true } },
      djService: { select: { id: true, name: true } },
      cateringService: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const id = toOptionalId(body.id);
  if (!id) return NextResponse.json({ error: "Missing plan id" }, { status: 400 });

  const existing = await prisma.eventPlan.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "התוכנית לא נמצאה" }, { status: 404 });

  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: "סוג אירוע לא תקין" }, { status: 400 });
  }

  const venueId = toOptionalId(body.venueId);
  const photographerServiceId = toOptionalId(body.photographerServiceId);
  const djServiceId = toOptionalId(body.djServiceId);
  const cateringServiceId = toOptionalId(body.cateringServiceId);
  const title = typeof body.title === "string" ? body.title.trim() || null : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const eventDate =
    typeof body.eventDate === "string" ? body.eventDate.trim() || null : null;
  const area = typeof body.area === "string" ? body.area.trim() || null : null;
  const budgetMin = toOptionalId(body.budgetMin);
  const budgetMax = toOptionalId(body.budgetMax);
  const checklistJson = parseChecklist(body.checklist);

  const textErrPut = validateEventPlanTextFields(title, notes, area, eventDate);
  if (textErrPut) return textErrPut;

  if (venueId !== null) {
    const v = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
    if (!v) return NextResponse.json({ error: "אולם לא נמצא" }, { status: 400 });
  }
  if (!(await validateServiceCategory(photographerServiceId, "צילום"))) {
    return NextResponse.json({ error: "יש לבחור שירות צילום תקין" }, { status: 400 });
  }
  if (!(await validateServiceCategory(djServiceId, "DJ"))) {
    return NextResponse.json({ error: "יש לבחור שירות DJ תקין" }, { status: 400 });
  }
  if (!(await validateServiceCategory(cateringServiceId, "קייטרינג"))) {
    return NextResponse.json({ error: "יש לבחור שירות קייטרינג תקין" }, { status: 400 });
  }

  const plan = await prisma.eventPlan.update({
    where: { id },
    data: {
      eventType,
      title,
      eventDate,
      area,
      budgetMin,
      budgetMax,
      checklistJson,
      venueId,
      photographerServiceId,
      djServiceId,
      cateringServiceId,
      notes,
    },
    include: {
      venue: { select: { id: true, name: true, city: true } },
      photographerService: { select: { id: true, name: true } },
      djService: { select: { id: true, name: true } },
      cateringService: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ plan });
}

/** עדכון צ'קליסט בלבד (לחיצה מהירה בכרטיס) */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const id = toOptionalId(body.id);
  if (!id) return NextResponse.json({ error: "Missing plan id" }, { status: 400 });

  const existing = await prisma.eventPlan.findFirst({
    where: { id, userId: user.id },
    select: { id: true, checklistJson: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "התוכנית לא נמצאה" }, { status: 404 });
  }

  const partial = body.checklist;
  if (typeof partial !== "object" || partial === null || Array.isArray(partial)) {
    return NextResponse.json({ error: "חסר אובייקט checklist" }, { status: 400 });
  }

  const merged = checklistObjectFromJson(existing.checklistJson);
  for (const k of ["venue", "photographer", "dj", "catering"] as const) {
    const v = (partial as Record<string, unknown>)[k];
    if (typeof v === "string" && ALLOWED_CHECKLIST.has(v)) {
      merged[k] = v as ChecklistState;
    }
  }
  const checklistJson = JSON.stringify(merged);

  const plan = await prisma.eventPlan.update({
    where: { id },
    data: { checklistJson },
    include: {
      venue: { select: { id: true, name: true, city: true } },
      photographerService: { select: { id: true, name: true } },
      djService: { select: { id: true, name: true } },
      cateringService: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ plan });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = toOptionalId(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing plan id" }, { status: 400 });

  const existing = await prisma.eventPlan.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "התוכנית לא נמצאה" }, { status: 404 });

  await prisma.eventPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

