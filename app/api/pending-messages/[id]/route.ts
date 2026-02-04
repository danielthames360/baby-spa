/**
 * Pending Message Detail API Route
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * GET - Get single pending message
 * PATCH - Update message status (mark as sent/skipped)
 * DELETE - Delete a pending message
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, handleApiError } from "@/lib/api-utils";
import { PendingMessageStatus } from "@prisma/client";

// GET - Get single message
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;

    const message = await prisma.pendingMessage.findUnique({
      where: { id },
      include: {
        sentBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Update message status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;
    const body = await request.json();
    const { action, skipReason } = body;

    // Validate action
    if (!["sent", "skipped"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'sent' or 'skipped'" },
        { status: 400 }
      );
    }

    // Get current message
    const message = await prisma.pendingMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (message.status !== PendingMessageStatus.PENDING) {
      return NextResponse.json(
        { error: "Message is not pending" },
        { status: 400 }
      );
    }

    // Update message
    const updatedMessage = await prisma.pendingMessage.update({
      where: { id },
      data: {
        status:
          action === "sent"
            ? PendingMessageStatus.SENT
            : PendingMessageStatus.SKIPPED,
        sentAt: new Date(),
        sentById: session.user.id,
        skipReason: action === "skipped" ? skipReason : null,
      },
      include: {
        sentBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Delete a pending message
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { id } = await params;

    const message = await prisma.pendingMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    await prisma.pendingMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
