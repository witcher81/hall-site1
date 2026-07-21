import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidIsraeliPhone, normalizePhoneInput } from "@/lib/phone";
import { assertPersonalPhoneAvailable } from "@/lib/phoneUnique";
import { saveProfileImageFile } from "@/lib/profileImageUpload";
import {
  parseSocialLinksJson,
  sanitizeSocialLinksFromClient,
  serializeSocialLinks,
} from "@/lib/socialLinks";
import {
  USER_INPUT_MAX,
  validateOptionalShortText,
  validateUploadedImageFile,
} from "@/lib/userInputValidation";

const BIO_MAX = 800;

const profileSelect = {
  name: true,
  email: true,
  phone: true,
  businessName: true,
  businessPhone: true,
  businessAddress: true,
  businessBio: true,
  profileImageUrl: true,
  socialLinksJson: true,
} as const;

function jsonUser(dbUser: {
  socialLinksJson: string | null;
  name: string | null;
  email: string;
  phone: string | null;
  businessName: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  businessBio: string | null;
  profileImageUrl: string | null;
}) {
  const { socialLinksJson, ...rest } = dbUser;
  return {
    ...rest,
    socialLinks: parseSocialLinksJson(socialLinksJson),
  };
}

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
    select: profileSelect,
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ user: jsonUser(dbUser) });
}

async function parseProfileBody(req: NextRequest): Promise<{
  name?: string;
  phone?: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessBio?: string;
  socialLinks?: unknown;
  profileImageFile: File | null;
  clearProfileImage: boolean;
}> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    const socialRaw = fd.get("socialLinks");
    let socialLinks: unknown = undefined;
    if (typeof socialRaw === "string" && socialRaw.trim()) {
      try {
        socialLinks = JSON.parse(socialRaw);
      } catch {
        socialLinks = [];
      }
    }
    const fileEntry = fd.get("profileImage");
    const profileImageFile =
      fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
    return {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      businessName: String(fd.get("businessName") ?? ""),
      businessPhone: String(fd.get("businessPhone") ?? ""),
      businessAddress: String(fd.get("businessAddress") ?? ""),
      businessBio: String(fd.get("businessBio") ?? ""),
      socialLinks,
      profileImageFile,
      clearProfileImage: fd.get("clearProfileImage") === "1",
    };
  }

  const body = await req.json();
  return {
    name: body.name,
    phone: body.phone,
    businessName: body.businessName,
    businessPhone: body.businessPhone,
    businessAddress: body.businessAddress,
    businessBio: body.businessBio,
    socialLinks: body.socialLinks,
    profileImageFile: null,
    clearProfileImage: body.clearProfileImage === true,
  };
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const {
    name,
    phone,
    businessName,
    businessPhone,
    businessAddress,
    businessBio,
    socialLinks,
    profileImageFile,
    clearProfileImage,
  } = await parseProfileBody(req);

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
  const bioRes = validateOptionalShortText(businessBio, BIO_MAX, "תיאור העסק");
  if (!bioRes.ok) {
    return NextResponse.json({ error: bioRes.error }, { status: 400 });
  }

  if (profileImageFile) {
    const imgErr = validateUploadedImageFile(profileImageFile);
    if (imgErr) {
      return NextResponse.json({ error: imgErr }, { status: 400 });
    }
  }

  const socialLinksProvided = socialLinks !== undefined;
  const cleanedSocial = socialLinksProvided
    ? sanitizeSocialLinksFromClient(socialLinks)
    : null;

  if (phoneResult.value) {
    const free = await assertPersonalPhoneAvailable(
      phoneResult.value,
      user.id
    );
    if (!free.ok) {
      return NextResponse.json({ error: free.error }, { status: 409 });
    }
  }

  let nextProfileImageUrl: string | null | undefined = undefined;
  if (clearProfileImage && !profileImageFile) {
    nextProfileImageUrl = null;
  } else if (profileImageFile) {
    const saved = await saveProfileImageFile(
      profileImageFile,
      `user-${user.id}`
    );
    if (!saved) {
      return NextResponse.json(
        { error: "העלאת התמונה נכשלה" },
        { status: 500 }
      );
    }
    nextProfileImageUrl = saved;
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: nameRes.value,
        phone: phoneResult.value,
        businessName: bizNameRes.value,
        businessPhone: businessPhoneResult.value,
        businessAddress: addrRes.value,
        businessBio: bioRes.value,
        ...(nextProfileImageUrl !== undefined
          ? { profileImageUrl: nextProfileImageUrl }
          : {}),
        ...(socialLinksProvided
          ? { socialLinksJson: serializeSocialLinks(cleanedSocial ?? []) }
          : {}),
      },
      select: profileSelect,
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

  return NextResponse.json({ user: jsonUser(updated) });
}
