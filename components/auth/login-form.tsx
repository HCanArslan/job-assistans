"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";

import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ nextPath, requireAuth }: { nextPath: string; requireAuth?: boolean }) {
  const [state, formAction, pending] = useActionState<LoginState | null, FormData>(loginAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-xs">
      {requireAuth ? (
        <p className="rounded-md border border-border bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground">
          Please sign in to continue.
        </p>
      ) : null}

      <input type="hidden" name="next" value={nextPath} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      {state && !state.ok && state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
