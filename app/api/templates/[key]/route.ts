/**
 * Template Detail API Route
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * GET - Get single template
 * PATCH - Update template
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, handleApiError } from "@/lib/api-utils";

// GET - Get single template
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    await withAuth(["OWNER"]);

    const { key } = await params;

    const template = await prisma.messageTemplate.findUnique({
      where: { key },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Update template
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    await withAuth(["OWNER"]);

    const { key } = await params;
    const body = await request.json();

    // Allowed fields to update
    const {
      name,
      description,
      emailEnabled,
      whatsappEnabled,
      subject,
      body: templateBody,
      bodyVersion2,
      bodyVersion3,
      variables,
      config,
      isActive,
    } = body;

    // Check if template exists
    const existing = await prisma.messageTemplate.findUnique({
      where: { key },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (emailEnabled !== undefined) updateData.emailEnabled = emailEnabled;
    if (whatsappEnabled !== undefined) updateData.whatsappEnabled = whatsappEnabled;
    if (subject !== undefined) updateData.subject = subject;
    if (templateBody !== undefined) updateData.body = templateBody;
    if (bodyVersion2 !== undefined) updateData.bodyVersion2 = bodyVersion2;
    if (bodyVersion3 !== undefined) updateData.bodyVersion3 = bodyVersion3;
    if (variables !== undefined) updateData.variables = variables;
    if (config !== undefined) updateData.config = config;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.messageTemplate.update({
      where: { key },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
