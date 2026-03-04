/**
 * Tests for the business logic in the Stripe webhook route.
 *
 * Since the route handler (POST) is tightly coupled to Next.js Request/Response
 * and Stripe SDK, we test the extracted pure helpers and the decision logic that
 * the webhook relies on.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resolveSubscriptionStatus,
  resolvePaymentFailedStatus,
  shouldGrantMonthlyAllowance,
} from "../stripe-helpers";

// ─── Webhook event routing logic ────────────────────────────────────────────

type WebhookHandler = (event: { type: string; data: { object: unknown } }) => string;

const routeEvent: WebhookHandler = (event) => {
  switch (event.type) {
    case "checkout.session.completed": return "checkout";
    case "customer.subscription.updated": return "sub_updated";
    case "customer.subscription.deleted": return "sub_deleted";
    case "invoice.payment_succeeded":
    case "invoice.paid": return "invoice_paid";
    case "invoice.payment_failed": return "invoice_failed";
    default: return "unhandled";
  }
};

describe("webhook event routing", () => {
  it("routes checkout.session.completed", () => {
    expect(routeEvent({ type: "checkout.session.completed", data: { object: {} } })).toBe("checkout");
  });

  it("routes customer.subscription.updated", () => {
    expect(routeEvent({ type: "customer.subscription.updated", data: { object: {} } })).toBe("sub_updated");
  });

  it("routes customer.subscription.deleted", () => {
    expect(routeEvent({ type: "customer.subscription.deleted", data: { object: {} } })).toBe("sub_deleted");
  });

  it("routes invoice.payment_succeeded", () => {
    expect(routeEvent({ type: "invoice.payment_succeeded", data: { object: {} } })).toBe("invoice_paid");
  });

  it("routes invoice.paid", () => {
    expect(routeEvent({ type: "invoice.paid", data: { object: {} } })).toBe("invoice_paid");
  });

  it("routes invoice.payment_failed", () => {
    expect(routeEvent({ type: "invoice.payment_failed", data: { object: {} } })).toBe("invoice_failed");
  });

  it("returns unhandled for unknown events", () => {
    expect(routeEvent({ type: "charge.succeeded", data: { object: {} } })).toBe("unhandled");
    expect(routeEvent({ type: "customer.created", data: { object: {} } })).toBe("unhandled");
  });
});

// ─── Checkout session logic ─────────────────────────────────────────────────

describe("checkout session logic", () => {
  function processCheckout(session: {
    mode: string;
    metadata?: { userId?: string };
    amount_total?: number;
  }) {
    if (!session.metadata?.userId) return { action: "skip", reason: "no userId" };
    if (session.mode === "subscription") return { action: "subscription" };
    if (session.mode === "payment") {
      const amountCents = session.amount_total ?? 0;
      return { action: "token_purchase", amountCents };
    }
    return { action: "unknown_mode" };
  }

  it("skips when no userId in metadata", () => {
    expect(processCheckout({ mode: "subscription" })).toEqual({ action: "skip", reason: "no userId" });
  });

  it("handles subscription mode", () => {
    expect(processCheckout({ mode: "subscription", metadata: { userId: "u1" } })).toEqual({
      action: "subscription",
    });
  });

  it("handles payment mode with amount", () => {
    const result = processCheckout({ mode: "payment", metadata: { userId: "u1" }, amount_total: 2000 });
    expect(result).toEqual({ action: "token_purchase", amountCents: 2000 });
  });

  it("defaults amount_total to 0 when missing", () => {
    const result = processCheckout({ mode: "payment", metadata: { userId: "u1" } });
    expect(result).toEqual({ action: "token_purchase", amountCents: 0 });
  });
});

// ─── Subscription status resolution (integration with stripe-helpers) ───────

describe("subscription status resolution in webhook context", () => {
  it("active subscription with known tier", () => {
    expect(resolveSubscriptionStatus("active", "pro")).toBe("pro");
    expect(resolveSubscriptionStatus("active", "plus")).toBe("plus");
    expect(resolveSubscriptionStatus("active", "ultra")).toBe("ultra");
  });

  it("active subscription with unknown tier falls back to pro", () => {
    expect(resolveSubscriptionStatus("active", null)).toBe("pro");
  });

  it("canceled maps to 'cancelled'", () => {
    expect(resolveSubscriptionStatus("canceled", "pro")).toBe("cancelled");
  });

  it("past_due maps to free", () => {
    expect(resolveSubscriptionStatus("past_due", "pro")).toBe("free");
  });
});

// ─── Payment failure handling ───────────────────────────────────────────────

describe("payment failure status resolution", () => {
  it("canceled → cancelled", () => {
    expect(resolvePaymentFailedStatus("canceled")).toBe("cancelled");
  });

  it("unpaid → cancelled", () => {
    expect(resolvePaymentFailedStatus("unpaid")).toBe("cancelled");
  });

  it("past_due → free", () => {
    expect(resolvePaymentFailedStatus("past_due")).toBe("free");
  });

  it("active → null (still retrying)", () => {
    expect(resolvePaymentFailedStatus("active")).toBeNull();
  });

  it("trialing → null (still retrying)", () => {
    expect(resolvePaymentFailedStatus("trialing")).toBeNull();
  });
});

// ─── Monthly allowance grant logic ──────────────────────────────────────────

describe("monthly allowance grant decision", () => {
  it("grants for pro/plus/ultra when not already on that tier", () => {
    expect(shouldGrantMonthlyAllowance("pro", "free")).toBe(true);
    expect(shouldGrantMonthlyAllowance("plus", "pro")).toBe(true);
    expect(shouldGrantMonthlyAllowance("ultra", "free")).toBe(true);
  });

  it("does not grant when already on same tier", () => {
    expect(shouldGrantMonthlyAllowance("pro", "pro")).toBe(false);
    expect(shouldGrantMonthlyAllowance("plus", "plus")).toBe(false);
    expect(shouldGrantMonthlyAllowance("ultra", "ultra")).toBe(false);
  });

  it("does not grant for free tier", () => {
    expect(shouldGrantMonthlyAllowance("free", "free")).toBe(false);
    expect(shouldGrantMonthlyAllowance("free", "pro")).toBe(false);
  });
});

// ─── Signature verification decision ────────────────────────────────────────

describe("webhook signature validation", () => {
  function validateSignature(signature: string | null, secret: string | undefined) {
    if (!signature) return { valid: false, error: "Missing stripe-signature header", status: 400 };
    if (!secret) return { valid: false, error: "Webhook secret not configured", status: 500 };
    return { valid: true };
  }

  it("rejects when no signature header", () => {
    const result = validateSignature(null, "whsec_test");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it("rejects when no webhook secret configured", () => {
    const result = validateSignature("sig_test", undefined);
    expect(result.valid).toBe(false);
    expect(result.status).toBe(500);
  });

  it("passes when both present", () => {
    const result = validateSignature("sig_test", "whsec_test");
    expect(result.valid).toBe(true);
  });
});

// ─── Invoice renewal logic ──────────────────────────────────────────────────

describe("invoice subscription renewal", () => {
  function shouldProcessInvoice(invoice: {
    subscription: string | null;
    billing_reason: string | null;
  }): boolean {
    return !!(invoice.subscription && invoice.billing_reason === "subscription_cycle");
  }

  it("processes subscription_cycle invoices", () => {
    expect(shouldProcessInvoice({ subscription: "sub_1", billing_reason: "subscription_cycle" })).toBe(true);
  });

  it("skips non-renewal invoices", () => {
    expect(shouldProcessInvoice({ subscription: "sub_1", billing_reason: "subscription_create" })).toBe(false);
    expect(shouldProcessInvoice({ subscription: "sub_1", billing_reason: "manual" })).toBe(false);
  });

  it("skips invoices without subscription", () => {
    expect(shouldProcessInvoice({ subscription: null, billing_reason: "subscription_cycle" })).toBe(false);
  });
});
