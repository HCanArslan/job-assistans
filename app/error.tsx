"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <AlertTriangle className="size-5 text-destructive" />
        <h2 className="text-sm font-semibold">Something went wrong</h2>
        <p className="text-xs text-muted-foreground">
          The action could not be completed. Check the database connection and try again.
        </p>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="size-3.5" />
          Try again
        </Button>
      </div>
    </div>
  );
}
