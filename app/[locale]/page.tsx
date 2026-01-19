'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function LocaleHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (status === 'loading') return;

    // Redirect based on session
    if (!session) {
      router.replace('/login');
      return;
    }

    const role = session.user?.role;
    switch (role) {
      case 'ADMIN':
      case 'RECEPTION':
        router.replace('/admin/dashboard');
        break;
      case 'THERAPIST':
        router.replace('/therapist/today');
        break;
      case 'PARENT':
        router.replace('/portal/dashboard');
        break;
      default:
        router.replace('/login');
    }
  }, [session, status, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
        <p className="text-teal-600 font-medium">{t("common.loading")}</p>
      </div>
    </div>
  );
}
