import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Retrieve payment settings (for portal and staff)
// Returns only payment-related settings needed for the payment flow
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Allow both staff and parents to access payment settings
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: {
        paymentQrImage: true,
        whatsappNumber: true,
        whatsappCountryCode: true,
        whatsappMessage: true,
      },
    });

    // Return empty defaults if no settings exist
    if (!settings) {
      return NextResponse.json({
        settings: {
          paymentQrImage: null,
          whatsappNumber: null,
          whatsappCountryCode: "+591",
          whatsappMessage: "Hola, adjunto mi comprobante de pago para la cita del {fecha} a las {hora}. Bebé: {bebe}",
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get payment settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
