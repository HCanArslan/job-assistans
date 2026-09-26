import { config as loadEnv } from "dotenv";
import * as readline from "node:readline";

loadEnv({ path: ".env.local" });
loadEnv();

const BCRYPT_COST = 12;

async function hashPassword(password: string): Promise<string> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.hash(password, BCRYPT_COST);
}

function readHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const stdin = process.stdin as NodeJS.ReadStream & { isTTY?: boolean };
    if (!stdin.isTTY) {
      rl.close();
      reject(new Error("No TTY available - pass the password as an argument instead."));
      return;
    }
    const out = process.stdout as NodeJS.WriteStream & { write: (chunk: string) => boolean };
    const originalWrite = rl.write.bind(rl);
    (rl as unknown as { _writeToOutput: (chunk: string) => void })._writeToOutput = (chunk: string) => {
      if (chunk.includes(question.replace(/\r?\n$/, ""))) originalWrite(chunk);
    };
    out.write(question);
    rl.question("", (answer) => {
      rl.close();
      out.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const argPassword = process.argv[2];
  let password = argPassword;

  if (!password && !process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    password = Buffer.concat(chunks).toString("utf8").trim();
  }

  if (!password) {
    try {
      password = await readHidden("Admin password: ");
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters long.");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  console.log("");
  console.log("Add this to your environment (.env.local locally, or the Vercel project settings):");
  console.log("");
  console.log(`ADMIN_EMAIL="you@example.com"`);
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
  console.log("");
  console.log("In .env files the dollar signs must be escaped, because Next.js expands $VAR there.");
  console.log("Paste this line into .env.local instead (it is the same hash):");
  console.log("");
  console.log(`ADMIN_PASSWORD_HASH="${hash.replace(/\$/g, "\\$")}"`);
  console.log("");
  console.log("Tip: generate AUTH_SECRET with");
  console.log(`  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`);
}

main().catch((error) => {
  console.error("Failed to generate password hash:", error);
  process.exit(1);
});
