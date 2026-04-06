import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidIsraeliPhone, normalizePhoneInput } from "@/lib/phone";
import { assertPersonalPhoneAvailable } from "@/lib/phoneUnique";
import { USER_INPUT_MAX, validateOptionalShortText } from "@/lib/userInputValidation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      role: true,
      businessName: true,
      businessPhone: true,
      businessAddress: true,
    },
  });

  return NextResponse.json({ user: dbUser });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    phone,
    businessName,
    businessPhone,
    businessAddress,
  } = body as {
    name?: string;
    phone?: string;
    businessName?: string;
    businessPhone?: string;
    businessAddress?: string;
  };

  const validateOptionalPhone = (
    val: string | undefined,
    fieldLabel: string
  ): { value: string | null; error?: string } => {
    if (!val || !String(val).trim()) return { value: null };
    const raw = normalizePhoneInput(String(val));
    if (!isValidIsraeliPhone(raw)) {
      return { value: null, error: `${fieldLabel} לא תקין` };
    }
    return { value: raw };
  };

  const phoneResult = validateOptionalPhone(phone, "טלפון אישי");
  if (phoneResult.error) {
    return NextResponse.json({ error: phoneResult.error }, { status: 400 });
  }
  const businessPhoneResult = validateOptionalPhone(businessPhone, "טלפון עסקי");
  if (businessPhoneResult.error) {
    return NextResponse.json({ error: businessPhoneResult.error }, { status: 400 });
  }

  const nameRes = validateOptionalShortText(name, USER_INPUT_MAX.DISPLAY_NAME, "שם");
  if (!nameRes.ok) {
    return NextResponse.json({ error: nameRes.error }, { status: 400 });
  }
  const bizNameRes = validateOptionalShortText(
    businessName,
    USER_INPUT_MAX.BUSINESS_NAME,
    "שם העסק"
  );
  if (!bizNameRes.ok) {
    return NextResponse.json({ error: bizNameRes.error }, { status: 400 });
  }
  const addrRes = validateOptionalShortText(
    businessAddress,
    USER_INPUT_MAX.ADDRESS,
    "כתובת"
  );
  if (!addrRes.ok) {
    return NextResponse.json({ error: addrRes.error }, { status: 400 });
  }

  if (phoneResult.value) {
    const free = await assertPersonalPhoneAvailable(
      phoneResult.value,
      user.id
    );
    if (!free.ok) {
      return NextResponse.json({ error: free.error }, { status: 409 });
    }
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: nameRes.value,
        phone: phoneResult.value,
        role: "VENUE_OWNER",
        businessName: bizNameRes.value,
        businessPhone: businessPhoneResult.value,
        businessAddress: addrRes.value,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        role: true,
        businessName: true,
        businessPhone: true,
        businessAddress: true,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const target = e.meta?.target as string[] | undefined;
      if (target?.includes("phone")) {
        return NextResponse.json(
          { error: "מספר הטלפון כבר רשום בחשבון אחר" },
          { status: 409 }
        );
      }
    }
    throw e;
  }

  return NextResponse.json({ user: updated });
}
