/**
 * Resend Webhook Handler
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Receives webhook events from Resend for email tracking:
 * - email.delivered
 * - email.opened
 * - email.bounced
 * - email.complained
 */

import { NextResponse } from "next/server";
import { emailService } from "@/lib/services/email-service";
import crypto from "crypto";

// Resend webhook secret for verification
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    bounce?: {
      message: string;
      type?: string;
    };
  };
}

/**
 * Verify webhook signature from Resend
 */
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("svix-signature") || "";

    // Verify signature in production
    if (WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
      if (!verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
        console.error("[Resend Webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Parse the payload
    const payload: ResendWebhookPayload = JSON.parse(rawBody);

    const { type, created_at, data } = payload;
    const resendId = data.email_id;

    if (!resendId) {
      return NextResponse.json(
        { error: "Missing email_id" },
        { status: 400 }
      );
    }

    console.log(`[Resend Webhook] Received event: ${type} for email: ${resendId}`);

    // Process the event
    await emailService.updateEmailStatus(
      resendId,
      type,
      new Date(created_at),
      data.bounce
        ? {
            type: data.bounce.type,
            reason: data.bounce.message,
          }
        : undefined
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Resend Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Return 200 for HEAD requests (Resend health check)
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// Return 405 for other methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
