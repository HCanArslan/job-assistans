import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth/guard";

export const metadata = { title: "Sign in · Job Assist" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/app");

  const params = await searchParams;
  const nextPath = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/app";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-[11px] text-primary-foreground">
              JA
            </span>
            Job Assist
          </div>
          <p className="text-xs text-muted-foreground">
            Private job search workspace. Sign in to continue.
          </p>
        </div>
        <LoginForm nextPath={nextPath} requireAuth={params.reason === "auth"} />
      </div>
    </main>
  );
}
