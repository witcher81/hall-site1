import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidIsraeliPhone, normalizePhoneInput } from "@/lib/phone";
import {
  parseSocialLinksJson,
  sanitizeSocialLinksFromClient,
  serializeSocialLinks,
} from "@/lib/socialLinks";
import { USER_INPUT_MAX, validateOptionalShortText } from "@/lib/userInputValidation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      businessName: true,
      businessPhone: true,
      businessAddress: true,
      socialLinksJson: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { socialLinksJson, ...rest } = dbUser;
  return NextResponse.json({
    user: {
      ...rest,
      socialLinks: parseSocialLinksJson(socialLinksJson),
    },
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name,
    phone,
    businessName,
    businessPhone,
    businessAddress,
    socialLinks,
  } = body as {
    name?: string;
    phone?: string;
    businessName?: string;
    businessPhone?: string;
    businessAddress?: string;
    socialLinks?: unknown;
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

  const socialLinksProvided = socialLinks !== undefined;
  const cleanedSocial = socialLinksProvided
    ? sanitizeSocialLinksFromClient(socialLinks)
    : null;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: nameRes.value,
      phone: phoneResult.value,
      businessName: bizNameRes.value,
      businessPhone: businessPhoneResult.value,
      businessAddress: addrRes.value,
      ...(socialLinksProvided
        ? { socialLinksJson: serializeSocialLinks(cleanedSocial ?? []) }
        : {}),
    },
    select: {
      name: true,
      email: true,
      phone: true,
      businessName: true,
      businessPhone: true,
      businessAddress: true,
      socialLinksJson: true,
    },
  });

  const { socialLinksJson: sj, ...rest } = updated;
  return NextResponse.json({
    user: {
      ...rest,
      socialLinks: parseSocialLinksJson(sj),
    },
  });
}
