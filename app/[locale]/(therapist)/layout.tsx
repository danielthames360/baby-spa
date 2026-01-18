import { TherapistNav } from "@/components/layout/therapist-nav";

interface TherapistLayoutProps {
  children: React.ReactNode;
}

export default function TherapistLayout({ children }: TherapistLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TherapistNav />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {children}
        </div>
      </main>

      {/* Footer simple */}
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        Baby Spa &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
