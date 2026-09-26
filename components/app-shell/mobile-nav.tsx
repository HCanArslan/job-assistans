"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, activeNavHref } from "@/components/app-shell/nav-items";
import { cn } from "@/lib/utils";

/** Compact horizontal nav for narrow screens. */
export function MobileNav() {
  const pathname = usePathname();
  const active = activeNavHref(pathname);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border bg-background px-2 py-1.5 md:hidden">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground",
              isActive && "bg-accent font-medium text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
