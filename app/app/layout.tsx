import { MobileNav } from "@/components/app-shell/mobile-nav";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAuth } from "@/lib/auth/guard";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar email={session.sub} />
          <MobileNav />
          <main className="min-w-0 flex-1 p-3 md:p-4">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
