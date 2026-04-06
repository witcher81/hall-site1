import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidIsraeliPhone, normalizePhoneInput } from "@/lib/phone";
import { assertPersonalPhoneAvailable } from "@/lib/phoneUnique";
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

  if (normalizedPhone) {
    const free = await assertPersonalPhoneAvailable(
      normalizedPhone,
      user.id
    );
    if (!free.ok) {
      return NextResponse.json({ error: free.error }, { status: 409 });
    }
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes("phone")) {
        return NextResponse.json(
          { error: "מספר הטלפון כבר רשום בחשבון אחר" },
          { status: 409 }
        );
      }
    }
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

