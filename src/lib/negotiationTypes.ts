import type { CatalogPricingMode } from "@/lib/catalogPricingMode";

/** סוגי שרשור הצעות מחיר */
export type NegotiationThreadKind = "VENUE" | "SUPPLIER";

export type NegotiationThreadStatus = "OPEN" | "DEAL_ACCEPTED" | "CLOSED";

export type NegotiationOfferStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "SUPERSEDED";

export type NegotiationAuthorRole = "SEEKER" | "VENUE_OWNER" | "FREELANCER";

export type NegotiationTimelineItem =
  | {
      type: "message";
      id: number;
      senderId: number;
      body: string;
      createdAt: string;
    }
  | {
      type: "offer";
      id: number;
      authorUserId: number;
      authorRole: NegotiationAuthorRole;
      amountMinNis: number | null;
      amountMaxNis: number | null;
      message: string | null;
      status: NegotiationOfferStatus;
      respondsToOfferId: number | null;
      createdAt: string;
    };

export type NegotiationThreadView = {
  id: number;
  kind: NegotiationThreadKind;
  threadKey: string;
  status: NegotiationThreadStatus;
  serviceId: number | null;
  serviceRequestId: number | null;
  conversationId: number;
  label: string;
  sublabel: string | null;
  timeline: NegotiationTimelineItem[];
  acceptedOffer: {
    id: number;
    amountMinNis: number | null;
    amountMaxNis: number | null;
    message: string | null;
  } | null;
  pricingMode: CatalogPricingMode;
  catalogMin: number | null;
  catalogMax: number | null;
  exactAmount: number | null;
  reQuoteUsed: boolean;
  reQuoteAllowed: boolean;
  canProviderQuote: boolean;
  canSeekerRequestReQuote: boolean;
  canSeekerDecide: boolean;
  pendingProviderOfferId: number | null;
};

export type NegotiationHubView = {
  inquiryId: number;
  threads: NegotiationThreadView[];
  currentUserId: number;
  currentUserRole: NegotiationAuthorRole;
};
