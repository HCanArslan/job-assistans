import {
  Building2,
  ClipboardList,
  Download,
  LayoutDashboard,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/app",
  },
  {
    href: "/app/companies",
    label: "Companies",
    icon: Building2,
    match: (pathname) => pathname.startsWith("/app/companies"),
  },
  {
    href: "/app/applications",
    label: "Applications",
    icon: ClipboardList,
    match: (pathname) => pathname.startsWith("/app/applications"),
  },
  {
    href: "/app/jobs/new",
    label: "Add Job",
    icon: Plus,
    match: (pathname) => pathname === "/app/jobs/new",
  },
  {
    href: "/app/import",
    label: "Import",
    icon: Download,
    match: (pathname) => pathname.startsWith("/app/import"),
  },
  {
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
    match: (pathname) => pathname.startsWith("/app/settings"),
  },
];

export function titleForPath(pathname: string): string {
  if (pathname === "/app") return "Dashboard";
  if (pathname === "/app/companies") return "Companies";
  if (pathname === "/app/companies/new") return "New company";
  if (pathname.startsWith("/app/companies/")) return "Company";
  if (pathname === "/app/jobs/new") return "Add job";
  if (pathname.startsWith("/app/jobs/")) return "Job";
  if (pathname === "/app/applications") return "Applications";
  if (pathname.startsWith("/app/applications/")) return "Application";
  if (pathname.startsWith("/app/import")) return "Import";
  if (pathname.startsWith("/app/settings")) return "Settings";
  return "Job Assist";
}

/** Resolves the sidebar item that should be highlighted for a path. */
export function activeNavHref(pathname: string): string | null {
  const match = NAV_ITEMS.find((item) => item.match(pathname));
  return match?.href ?? null;
}
