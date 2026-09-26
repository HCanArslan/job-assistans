"use client";

import { Moon, Sun } from "lucide-react";

import { useIsDark } from "@/components/app-shell/use-is-dark";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "job-assist-theme";

export function ThemeToggle() {
  const dark = useIsDark();

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // ignore storage failures
    }
  };

  return (
    <Button variant="ghost" size="icon-sm" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
      {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </Button>
  );
}
