import "server-only";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/siteUrl";

export async function getProviderConnectAccountId(
  userId: number
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeConnectAccountId: true, stripeConnectChargesEnabled: true },
  });
  if (!user?.stripeConnectAccountId || !user.stripeConnectChargesEnabled) {
    return null;
  }
  return user.stripeConnectAccountId;
}

export async function ensureStripeConnectAccount(userId: number): Promise<{
  accountId: string;
  onboardingUrl: string;
} | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      stripeConnectAccountId: true,
    },
  });
  if (!user || (user.role !== "FREELANCER" && user.role !== "VENUE_OWNER")) {
    return null;
  }

  let accountId = user.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "IL",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { userId: String(user.id) },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectAccountId: accountId },
    });
  }

  const siteUrl = getSiteUrl();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/dashboard/stripe-connect?refresh=1`,
    return_url: `${siteUrl}/dashboard/stripe-connect?success=1`,
    type: "account_onboarding",
  });

  if (!accountLink.url) return null;
  return { accountId, onboardingUrl: accountLink.url };
}

export async function syncStripeConnectStatus(userId: number): Promise<{
  chargesEnabled: boolean;
  onboardingComplete: boolean;
  accountId: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeConnectAccountId: true },
  });
  if (!user?.stripeConnectAccountId) {
    return {
      chargesEnabled: false,
      onboardingComplete: false,
      accountId: null,
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return {
      chargesEnabled: false,
      onboardingComplete: false,
      accountId: user.stripeConnectAccountId,
    };
  }

  const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
  const chargesEnabled = Boolean(account.charges_enabled);
  const onboardingComplete = Boolean(account.details_submitted);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeConnectChargesEnabled: chargesEnabled,
      stripeConnectOnboardingComplete: onboardingComplete,
    },
  });

  return {
    chargesEnabled,
    onboardingComplete,
    accountId: user.stripeConnectAccountId,
  };
}
