import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidIsraeliPhone, normalizePhoneInput } from "@/lib/phone";

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

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name?.trim() || null,
      phone: phoneResult.value,
      role: "VENUE_OWNER",
      businessName: businessName?.trim() || null,
      businessPhone: businessPhoneResult.value,
      businessAddress: businessAddress?.trim() || null,
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

  return NextResponse.json({ user: updated });
}
