/**
 * Decoding of the public Airtable shared-view response body.
 *
 * The public StillHiring shared view currently answers with MessagePack
 * (`application/msgpack`, using msgpackr record structures); older responses were
 * plain JSON. Both are decoded here so the rest of the importer only ever sees a
 * parsed object. `msgpackr` is only needed by the CLI sync and the tests.
 */
import { unpack } from "msgpackr";

/** Thrown when the captured response body cannot be decoded. */
export class StillHiringDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StillHiringDecodeError";
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** True when the decoded object looks like a shared-view payload. */
export function isSharedViewPayload(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const table = (value as { data?: { table?: { columns?: unknown; rows?: unknown } } }).data?.table;
  return Boolean(table && Array.isArray(table.columns) && Array.isArray(table.rows));
}

function decodeJson(body: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch (error) {
    throw new StillHiringDecodeError(`Response body is not valid JSON: ${errorMessage(error)}`);
  }
}

function decodeMsgpack(body: Uint8Array): unknown {
  try {
    return unpack(body);
  } catch (error) {
    throw new StillHiringDecodeError(`Response body is not valid MessagePack: ${errorMessage(error)}`);
  }
}

/**
 * Decodes a shared-view response body. The content type decides the format;
 * when it is missing or unknown, JSON is attempted first and MessagePack second.
 */
export function decodeSharedViewBody(body: Uint8Array, contentType?: string | null): unknown {
  const type = (contentType ?? "").toLowerCase();
  if (type.includes("json")) return decodeJson(body);
  if (type.includes("msgpack")) return decodeMsgpack(body);
  try {
    return decodeJson(body);
  } catch {
    return decodeMsgpack(body);
  }
}
