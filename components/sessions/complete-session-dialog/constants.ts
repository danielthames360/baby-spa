import { Banknote, QrCode, CreditCard, Building } from "lucide-react";

export const PAYMENT_METHODS = [
  { value: "CASH", icon: Banknote, color: "emerald" },
  { value: "QR", icon: QrCode, color: "purple" },
  { value: "CARD", icon: CreditCard, color: "violet" },
  { value: "TRANSFER", icon: Building, color: "blue" },
] as const;
