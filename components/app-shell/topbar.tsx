"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { CommandMenu } from "@/components/app-shell/command-menu";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { UserMenu } from "@/components/app-shell/user-menu";
import { titleForPath } from "@/components/app-shell/nav-items";
import { Button } from "@/components/ui/button";

export function Topbar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="flex h-12 items-center gap-2 border-b border-border bg-background px-3">
      <h1 className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight">
        {titleForPath(pathname)}
      </h1>
      <div className="hidden sm:block">
        <CommandMenu />
      </div>
      <Button asChild size="sm" className="h-7">
        <Link href="/app/jobs/new">
          <Plus className="size-3.5" />
          Add Job
        </Link>
      </Button>
      <ThemeToggle />
      <UserMenu email={email} />
    </header>
  );
}
