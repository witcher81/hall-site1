import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidIsraeliPhone, normalizePhoneInput } from "@/lib/phone";
import { USER_INPUT_MAX, validateOptionalShortText } from "@/lib/userInputValidation";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const nameResult = validateOptionalShortText(
    body.name,
    USER_INPUT_MAX.DISPLAY_NAME,
    "שם"
  );
  if (!nameResult.ok) {
    return NextResponse.json({ error: nameResult.error }, { status: 400 });
  }
  const name = nameResult.value;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const normalizedPhone =
    phone && phone.length > 0 ? normalizePhoneInput(phone) : null;
  if (normalizedPhone && !isValidIsraeliPhone(normalizedPhone)) {
    return NextResponse.json(
      { error: "מספר טלפון לא תקין. יש להזין מספר ישראלי תקין" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone: normalizedPhone || null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

