/**
 * Captures the public StillHiring Airtable shared view payload with Playwright.
 *
 * The signed `accessPolicy` in readSharedViewData URLs expires, so this never
 * uses a hardcoded URL: it opens the public shared view/embed in a real browser
 * and reads the JSON response the public page itself receives.
 *
 * Requires no Airtable account, API key, or private table access.
 */
import type { Browser, Page, Response } from "playwright";

import { decodeSharedViewBody, isSharedViewPayload } from "@/lib/still-hiring/decode";

/** Airtable ids for the StillHiring public company list. */
export const STILL_HIRING_AIRTABLE = {
  applicationId: "appPGrJqA2zH65k5I",
  tableId: "tblKU0jQiyIX182uU",
  shareId: "shrI8dno1rMGKZM8y",
  viewId: "viwpPe6EkDqbE7Q2o",
} as const;

const { applicationId, tableId, shareId, viewId } = STILL_HIRING_AIRTABLE;

/** Candidate public URLs - the shared view has been reachable at several of these shapes. */
export function candidateSharedViewUrls(): string[] {
  const urls = [
    `https://airtable.com/embed/${applicationId}/${shareId}?backgroundColor=gray`,
    `https://airtable.com/embed/${shareId}?backgroundColor=gray`,
    `https://airtable.com/embed/${applicationId}/${shareId}/${tableId}/${viewId}?backgroundColor=gray&viewControls=on`,
    `https://airtable.com/${applicationId}/${shareId}/${tableId}/${viewId}`,
    `https://airtable.com/${shareId}?viewControls=on`,
  ];
  const extra = process.env.STILL_HIRING_URL?.trim();
  if (extra) urls.unshift(extra);
  return urls;
}

const RESPONSE_TIMEOUT_MS = Number(process.env.STILL_HIRING_CAPTURE_TIMEOUT_MS ?? 45_000);

interface CapturedPayload {
  payload: unknown;
  pageUrl: string;
  matchedUrl: string;
}

function looksLikeSharedViewData(value: unknown): boolean {
  return isSharedViewPayload(value);
}

/**
 * The public shared view answers with MessagePack (`application/msgpack`, encoded
 * with msgpackr record structures) and, on older responses, plain JSON.
 */
async function decodeResponseBody(response: Response): Promise<unknown> {
  const buffer = await response.body();
  return decodeSharedViewBody(buffer, response.headers()["content-type"]);
}

/**
 * Navigates to one candidate URL and waits for the readSharedViewData response.
 *
 * The listener is attached *before* `goto` on purpose: the embed page requests
 * its data while the navigation is still settling, so a listener registered
 * afterwards misses the response entirely.
 */
async function captureFromUrl(
  page: Page,
  url: string,
  log: (line: string) => void,
): Promise<CapturedPayload | null> {
  let resolvePayload: ((value: CapturedPayload | null) => void) | null = null;
  const payloadPromise = new Promise<CapturedPayload | null>((resolve) => {
    resolvePayload = resolve;
  });

  const seen: string[] = [];
  let done = false;

  const onResponse = (response: Response) => {
    const target = response.url();
    if (!target.includes("readSharedViewData")) return;
    seen.push(`${response.status()} ${response.headers()["content-type"] ?? "?"} ${target.split("?")[0]}`);
    void decodeResponseBody(response)
      .then((json: unknown) => {
        if (!done && looksLikeSharedViewData(json)) {
          done = true;
          resolvePayload?.({ payload: json, pageUrl: page.url(), matchedUrl: target });
        }
      })
      .catch(() => {
        // Not decodable - keep listening.
      });
  };

  page.on("response", onResponse);
  const timer = setTimeout(() => {
    if (!done) {
      done = true;
      resolvePayload?.(null);
    }
  }, RESPONSE_TIMEOUT_MS);

  try {
    log(`Opening ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });

    // Nudge lazy shared views into requesting their data, but never block the
    // capture itself: the response usually arrives within a second or two.
    const nudger = (async () => {
      for (let i = 0; i < 10 && !done; i += 1) {
        await page.mouse.wheel(0, 1200).catch(() => {});
        await page.waitForTimeout(700);
      }
    })();

    const captured = await payloadPromise;
    done = true;
    await nudger.catch(() => {});
    if (!captured && seen.length > 0) log(`  readSharedViewData seen but unusable: ${seen.join(", ")}`);
    return captured;
  } finally {
    clearTimeout(timer);
    page.off("response", onResponse);
  }
}

export interface CaptureOptions {
  /** Called with progress/error notes (shown in the CLI output). */
  log?: (line: string) => void;
}

/**
 * Launches Chromium headless, opens the public shared view and returns the
 * parsed readSharedViewData JSON.
 */
export async function captureStillHiringSharedView(options: CaptureOptions = {}): Promise<unknown> {
  const log = options.log ?? (() => {});
  const { chromium } = await import("playwright");
  const ignoreHTTPSErrors = process.env.STILL_HIRING_INSECURE_TLS === "1";
  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const errors: string[] = [];
  try {
    for (const url of candidateSharedViewUrls()) {
      const context = await browser.newContext({
        ignoreHTTPSErrors,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();
      try {
        const captured = await captureFromUrl(page, url, log);
        if (captured) {
          log(`Captured readSharedViewData from ${captured.matchedUrl.split("?")[0]}`);
          return captured.payload;
        }
        errors.push(`${url} - no readSharedViewData response observed`);
      } catch (error) {
        errors.push(`${url} - ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        await context.close().catch(() => {});
      }
    }

    if (ignoreHTTPSErrors === false && errors.some((line) => /certificate|SSL|ERR_CERT/i.test(line))) {
      throw new Error(
        [
          "Could not read the public StillHiring shared view: TLS certificate error.",
          "If you are behind a TLS-inspecting proxy (corporate antivirus, VPN), run with:",
          "  STILL_HIRING_INSECURE_TLS=1 npm run stillhiring:sync",
          "",
          ...errors,
        ].join("\n"),
      );
    }

    throw new Error(
      [
        "Could not find a readSharedViewData response on the public StillHiring shared view.",
        "Tried:",
        ...errors.map((line) => `  - ${line}`),
        "",
        "The public shared view may have been renamed or replaced. Set STILL_HIRING_URL to the",
        "current public StillHiring Airtable share URL and retry.",
      ].join("\n"),
    );
  } finally {
    await browser.close().catch(() => {});
  }
}
