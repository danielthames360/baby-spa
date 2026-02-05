"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import {
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Percent,
  Baby,
  Package,
  CreditCard,
  UserPlus,
  PartyPopper,
  IdCard,
  Gift,
  Eye,
  Clock,
  User,
  ClipboardCheck,
  Wallet,
  DollarSign,
  Receipt,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency-utils";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  performedBy: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

interface ActivityCardProps {
  activity: Activity;
  locale: string;
}

// Icon and color configuration for each activity type
const ACTIVITY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    iconColor: string;
  }
> = {
  SESSION_COMPLETED: {
    icon: CheckCircle,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  DISCOUNT_APPLIED: {
    icon: Percent,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  APPOINTMENT_CREATED: {
    icon: Calendar,
    bgColor: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  APPOINTMENT_CREATED_PORTAL: {
    icon: Calendar,
    bgColor: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  APPOINTMENT_CANCELLED: {
    icon: XCircle,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
  },
  APPOINTMENT_CANCELLED_PORTAL: {
    icon: XCircle,
    bgColor: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  APPOINTMENT_RESCHEDULED: {
    icon: RefreshCw,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  APPOINTMENT_RESCHEDULED_PORTAL: {
    icon: RefreshCw,
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  BABY_CARD_SOLD: {
    icon: IdCard,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  BABY_CARD_REWARD_DELIVERED: {
    icon: Gift,
    bgColor: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  INSTALLMENT_PAID: {
    icon: CreditCard,
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  EVENT_REGISTRATION: {
    icon: PartyPopper,
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  BABY_CREATED: {
    icon: Baby,
    bgColor: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  PACKAGE_ASSIGNED: {
    icon: Package,
    bgColor: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  CLIENT_UPDATED: {
    icon: UserPlus,
    bgColor: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  EVALUATION_SAVED: {
    icon: ClipboardCheck,
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  STAFF_PAYMENT_REGISTERED: {
    icon: Wallet,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  EXPENSE_REGISTERED: {
    icon: Receipt,
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  CASH_REGISTER_OPENED: {
    icon: DollarSign,
    bgColor: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  CASH_REGISTER_CLOSED: {
    icon: DollarSign,
    bgColor: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  CASH_REGISTER_EXPENSE_ADDED: {
    icon: Receipt,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  CASH_REGISTER_REVIEWED: {
    icon: ShieldCheck,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  CASH_REGISTER_FORCE_CLOSED: {
    icon: AlertTriangle,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
  },
};

const DEFAULT_CONFIG = {
  icon: Clock,
  bgColor: "bg-gray-100",
  iconColor: "text-gray-600",
};

export function ActivityCard({ activity, locale }: ActivityCardProps) {
  const router = useRouter();
  const t = useTranslations("activity");
  const tTypes = useTranslations("activity.types");
  const format = useFormatter();

  const config = ACTIVITY_CONFIG[activity.type] || DEFAULT_CONFIG;
  const Icon = config.icon;

  // Format time
  const time = format.dateTime(new Date(activity.createdAt), {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get localized activity title
  const getActivityTitle = () => {
    // The title is a translation key like "activity.session_completed"
    // We extract the key and translate it with metadata
    const titleKey = activity.title.replace("activity.", "");
    const metadata = activity.metadata || {};

    try {
      return tTypes(titleKey, metadata as Record<string, string>);
    } catch {
      // Fallback to a generic type translation
      return tTypes(activity.type.toLowerCase());
    }
  };

  // Build description from metadata
  const getDescription = () => {
    const metadata = activity.metadata as Record<string, unknown> | null;
    if (!metadata) return activity.description;

    const parts: string[] = [];

    if (metadata.babyName) {
      parts.push(String(metadata.babyName));
    }

    if (metadata.packageName) {
      parts.push(String(metadata.packageName));
    }

    if (metadata.date && metadata.time) {
      parts.push(`${metadata.date} - ${metadata.time}`);
    }

    if (metadata.amount !== undefined) {
      parts.push(formatCurrency(Number(metadata.amount), locale));
    }

    return parts.length > 0 ? parts.join(" • ") : activity.description;
  };

  // Handle navigation to the related entity
  const handleView = () => {
    const metadata = activity.metadata as Record<string, unknown> | null;

    switch (activity.entityType) {
      case "appointment": {
        // Navigate to calendar with the appointment
        const params = new URLSearchParams();
        if (metadata?.date) {
          params.set("date", String(metadata.date));
        }
        if (activity.entityId) {
          params.set("appointmentId", activity.entityId);
        }
        router.push(
          `/${locale}/admin/calendar${params.toString() ? `?${params.toString()}` : ""}`
        );
        break;
      }

      case "session": {
        // Navigate to calendar with the appointment date and ID (same as appointments)
        const sessionParams = new URLSearchParams();
        if (metadata?.date) {
          sessionParams.set("date", String(metadata.date));
        }
        if (metadata?.appointmentId) {
          sessionParams.set("appointmentId", String(metadata.appointmentId));
        }
        router.push(
          `/${locale}/admin/calendar${sessionParams.toString() ? `?${sessionParams.toString()}` : ""}`
        );
        break;
      }

      case "baby": {
        // Navigate to baby profile
        if (activity.entityId) {
          router.push(`/${locale}/admin/babies/${activity.entityId}`);
        } else {
          router.push(`/${locale}/admin/babies`);
        }
        break;
      }

      case "babyCardPurchase": {
        // Navigate to baby cards
        router.push(`/${locale}/admin/baby-cards`);
        break;
      }

      case "packagePurchase": {
        // Navigate to the baby profile packages tab
        if (metadata?.babyId) {
          router.push(`/${locale}/admin/babies/${metadata.babyId}?tab=packages`);
        } else {
          router.push(`/${locale}/admin/packages`);
        }
        break;
      }

      case "eventParticipant": {
        // Navigate to events
        if (metadata?.eventId) {
          router.push(`/${locale}/admin/events/${metadata.eventId}`);
        } else {
          router.push(`/${locale}/admin/events`);
        }
        break;
      }

      case "evaluation": {
        // Navigate to calendar with the appointment date and ID
        const evalParams = new URLSearchParams();
        if (metadata?.date) {
          evalParams.set("date", String(metadata.date));
        }
        if (metadata?.appointmentId) {
          evalParams.set("appointmentId", String(metadata.appointmentId));
        }
        router.push(
          `/${locale}/admin/calendar${evalParams.toString() ? `?${evalParams.toString()}` : ""}`
        );
        break;
      }

      default:
        // No specific navigation
        break;
    }
  };

  // Check if we can navigate to this entity
  const canNavigate = [
    "appointment",
    "session",
    "baby",
    "babyCardPurchase",
    "packagePurchase",
    "eventParticipant",
    "evaluation",
  ].includes(activity.entityType || "");

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/50 bg-white/80 p-3 shadow-sm transition-all hover:shadow-md">
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          config.bgColor
        )}
      >
        <Icon className={cn("h-5 w-5", config.iconColor)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900">{getActivityTitle()}</p>
            {getDescription() && (
              <p className="mt-0.5 text-sm text-gray-500 truncate">
                {getDescription()}
              </p>
            )}
          </div>

          {/* Time and View button */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-gray-400">{time}</span>
            {canNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="h-8 rounded-lg px-2 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Performed by */}
        {activity.performedBy && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
            <User className="h-3 w-3" />
            <span>{activity.performedBy.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
