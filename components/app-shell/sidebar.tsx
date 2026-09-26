"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, activeNavHref } from "@/components/app-shell/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const active = activeNavHref(pathname);

  return (
    <aside className="hidden w-52 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-12 items-center gap-2 border-b border-sidebar-border px-3">
        <span className="inline-flex size-5 items-center justify-center rounded bg-primary text-[10px] font-semibold text-primary-foreground">
          JA
        </span>
        <span className="text-[13px] font-semibold tracking-tight">Job Assist</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-sidebar-accent font-medium text-sidebar-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4 opacity-80" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <p className="px-2 text-[11px] text-muted-foreground">Europe/Istanbul · single user</p>
      </div>
    </aside>
  );
}
