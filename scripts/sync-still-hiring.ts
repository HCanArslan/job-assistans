import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import { runStillHiringSync } from "@/lib/still-hiring/import";
import { StillHiringStructureError } from "@/lib/still-hiring/types";

import { captureStillHiringSharedView } from "./capture-shared-view";

const useColor = process.stdout.isTTY;

function heading(text: string) {
  const line = "=".repeat(text.length);
  console.log(useColor ? `\n${text}\n${line}` : `\n${text}`);
}

async function main() {
  heading("StillHiring sync");

  if (!process.env.DATABASE_URL) {
    console.error(
      "\nDATABASE_URL is not set. Create .env.local (copy of .env.example) or export DATABASE_URL,",
      "\nthen run migrations with `npm run db:migrate` before syncing.",
    );
    process.exit(1);
  }

  const { prisma } = await import("@/lib/db/prisma");
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error(
      "\nDatabase connection failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }

  const startedAt = Date.now();
  try {
    const summary = await runStillHiringSync({
      capture: () => captureStillHiringSharedView({ log: (line) => console.log(line) }),
      client: prisma,
      onProgress: (processed, total) => {
        if (processed % 100 !== 0 && processed !== total) return;
        process.stdout.write(`\rUpserting ${processed}/${total}...`);
        if (processed === total) process.stdout.write("\n");
      },
    });

    if (summary.failed > 0) {
      console.error(`\n${summary.failed} rows failed to import - see the list above.`);
      process.exitCode = 1;
    }
    console.log(`\nFinished in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
  } catch (error) {
    if (error instanceof StillHiringStructureError) {
      console.error(`\nStillHiring response could not be understood: ${error.message}`);
    } else {
      console.error(
        "\nStillHiring sync failed:",
        error instanceof Error ? error.message : error,
      );
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
