/**
 * Message Templates API Route
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * GET - List all templates
 * POST - Seed default templates
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, handleApiError } from "@/lib/api-utils";
import { templateService } from "@/lib/services/template-service";
import { TemplateCategory } from "@prisma/client";

// GET - List all templates
export async function GET(request: Request) {
  try {
    await withAuth(["OWNER"]);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as TemplateCategory | null;

    const where = category ? { category } : {};

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Seed or reseed templates
export async function POST(request: Request) {
  try {
    await withAuth(["OWNER"]);

    const body = await request.json();
    const { action } = body;

    const locale = templateService.getLocale();

    if (action === "seed") {
      const created = await templateService.seedDefaultTemplates();
      return NextResponse.json({
        success: true,
        created,
        locale,
        message: `${created} templates created (${locale})`,
      });
    }

    if (action === "reseed") {
      const result = await templateService.reseedAllTemplates();
      return NextResponse.json({
        success: true,
        created: result.created,
        updated: result.updated,
        locale,
        message: `${result.created} templates created, ${result.updated} templates updated (${locale})`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
