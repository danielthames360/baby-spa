/**
 * Template Preview API
 * Returns rendered HTML preview of a template with the email wrapper
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Sample data for preview variables
const SAMPLE_VARIABLES: Record<string, string> = {
  parentName: "María García",
  babyName: "Lucas",
  date: "viernes, 7 de febrero de 2025",
  time: "10:00",
  newDate: "viernes, 7 de febrero de 2025",
  newTime: "10:00",
  serviceName: "Hidroterapia Individual",
  address: "Av. Principal #123, Santa Cruz",
  portalUrl: "https://bo.babyspa.online/portal",
  months: "6",
  bookingUrl: "https://bo.babyspa.online/portal",
  lastVisitDate: "15 de enero de 2025",
  currentAge: "6 meses",
  oldDate: "jueves, 6 de febrero de 2025",
  oldTime: "14:00",
  count: "2",
  appointmentsList: "10:00 - Lucas - Hidroterapia\n14:00 - Sofía - Masaje",
  amount: "150 BOB",
  whatsappNumber: "+591 70000000",
  eventName: "Taller de Padres Primerizos",
  appointmentCount: "3",
  pendingMessagesCount: "5",
  emailsSentYesterday: "12 (10 entregados, 0 rebotados)",
  mesversaryList: "• Lucas cumple 6 meses el 10 de febrero",
  attentionList: "• 2 leads que pueden haber dado a luz",
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { templateBody, subject, title } = body;

    if (!templateBody) {
      return NextResponse.json({ error: "templateBody is required" }, { status: 400 });
    }

    // Get system settings for email config
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bo.babyspa.online";

    const config = {
      logoUrl: `${baseUrl}/images/logoBabySpa.png`,
      businessName: "Baby Spa",
      businessAddress: settings?.businessAddress || "Av. Principal #123",
      whatsappNumber: settings?.whatsappNumber || "+591 70000000",
      whatsappCountryCode: settings?.whatsappCountryCode || "+591",
      instagramHandle: settings?.instagramHandle || "babyspa.bo",
      portalUrl: `${baseUrl}/portal`,
    };

    // Replace variables with sample data
    let processedBody = templateBody;
    for (const [key, value] of Object.entries(SAMPLE_VARIABLES)) {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      processedBody = processedBody.replace(regex, value);
    }

    // Import the email template functions
    const { wrapEmailContent } = await import("@/lib/utils/email-template");

    // Convert URLs and markdown links to clickable links
    // Supports: [Link Text](url) and plain URLs
    const linkify = (text: string): string => {
      // First, handle markdown-style links: [text](url)
      const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
      let result = text.replace(markdownLinkRegex, '<a href="$2" target="_blank" style="color: #0d9488; text-decoration: underline; font-weight: 500;">$1</a>');

      // Then, handle plain URLs that are not already in href attributes
      const plainUrlRegex = /(?<!href=")(https?:\/\/[^\s<"]+)/g;
      result = result.replace(plainUrlRegex, '<a href="$1" target="_blank" style="color: #0d9488; text-decoration: underline;">$1</a>');

      return result;
    };

    // Convert plain text to HTML (same logic as sendStyledEmail)
    const bodyHtml = processedBody
      .split("\n\n")
      .map((paragraph: string) => {
        // Check if it's a list item
        if (paragraph.trim().startsWith("•") || paragraph.trim().startsWith("-")) {
          const items = paragraph.split("\n").map((item: string) => {
            const text = item.replace(/^[•\-]\s*/, "").trim();
            return text ? `<li style="margin-bottom: 4px;">${linkify(text)}</li>` : "";
          }).filter(Boolean).join("");
          return `<ul style="margin: 8px 0; padding-left: 20px; color: #374151;">${items}</ul>`;
        }

        // Check if it starts with recommendation emoji (📋 or ⚠️) - Amber/Yellow
        if (paragraph.trim().startsWith("📋") || paragraph.trim().startsWith("⚠️")) {
          const lines = paragraph.split("\n");
          const header = lines[0];
          const rest = lines.slice(1).join("\n");

          // Check if rest contains a list
          if (rest.trim().startsWith("•") || rest.trim().startsWith("-")) {
            const items = rest.split("\n").map((item: string) => {
              const text = item.replace(/^[•\-]\s*/, "").trim();
              return text ? `<li style="margin-bottom: 4px;">${linkify(text)}</li>` : "";
            }).filter(Boolean).join("");
            return `
              <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">${header}</p>
                <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">${items}</ul>
              </div>
            `;
          }
          return `
            <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">${linkify(paragraph.replace(/\n/g, "<br>"))}</p>
            </div>
          `;
        }

        // Check if it starts with ❌ (cancelled/before) - Red
        if (paragraph.trim().startsWith("❌")) {
          const lines = paragraph.split("\n").map((line: string) =>
            `<p style="margin: 4px 0; font-size: 16px; color: #991b1b;">${linkify(line)}</p>`
          ).join("");
          return `<div style="background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">${lines}</div>`;
        }

        // Check if it starts with ✅ (confirmed/after) - Green
        if (paragraph.trim().startsWith("✅")) {
          const lines = paragraph.split("\n").map((line: string) =>
            `<p style="margin: 4px 0; font-size: 16px; color: #166534;">${linkify(line)}</p>`
          ).join("");
          return `<div style="background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a; padding: 16px; margin: 16px 0;">${lines}</div>`;
        }

        // Check if it's appointment details (👶📅🕐💆📍🎂🎉💙) - Teal
        if (/^[👶📅🕐💆📍🎂🎉💙]/.test(paragraph.trim())) {
          const lines = paragraph.split("\n").map((line: string) =>
            `<p style="margin: 4px 0; font-size: 16px; color: #134e4a;">${linkify(line)}</p>`
          ).join("");
          return `<div style="background: linear-gradient(135deg, #f0fdfa 0%, #e0f2f1 100%); border-radius: 12px; border-left: 4px solid #0d9488; padding: 16px; margin: 16px 0;">${lines}</div>`;
        }

        // Regular paragraph - linkify URLs
        return `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">${linkify(paragraph.replace(/\n/g, "<br>"))}</p>`;
      })
      .join("");

    // Create the content with title
    const displayTitle = title || subject || "Vista previa";
    const content = `
      <h2 style="color: #134e4a; font-size: 22px; margin: 0 0 20px 0;">${displayTitle}</h2>
      ${bodyHtml}
    `;

    // Wrap in the beautiful HTML template
    const html = wrapEmailContent(content, config);

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
