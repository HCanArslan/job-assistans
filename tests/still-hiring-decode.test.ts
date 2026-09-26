/**
 * The public shared view answers with MessagePack (msgpackr record structures) and,
 * on older responses, JSON - both must decode into the same object.
 */
import { pack } from "msgpackr";
import { describe, expect, it } from "vitest";

import {
  StillHiringDecodeError,
  decodeSharedViewBody,
  isSharedViewPayload,
} from "@/lib/still-hiring/decode";

const payload = {
  data: {
    table: {
      columns: [{ id: "fldCompanyName", name: "Company Name", type: "text" }],
      rows: [{ id: "recDecode000000001", cellValuesByColumnId: { fldCompanyName: "Decode Ltd" } }],
    },
  },
};

describe("shared-view body decoding", () => {
  it("decodes JSON bodies", () => {
    const body = new TextEncoder().encode(JSON.stringify(payload));
    expect(decodeSharedViewBody(body, "application/json")).toEqual(payload);
  });

  it("decodes MessagePack bodies", () => {
    const body = pack(payload);
    expect(decodeSharedViewBody(body, "application/msgpack")).toEqual(payload);
  });

  it("falls back to MessagePack when the content type is missing", () => {
    expect(decodeSharedViewBody(pack(payload), null)).toEqual(payload);
    expect(decodeSharedViewBody(pack(payload), "binary/octet-stream")).toEqual(payload);
  });

  it("explains undecodable bodies instead of crashing", () => {
    const garbage = new Uint8Array([0xff, 0xfe, 0xfd]);
    expect(() => decodeSharedViewBody(garbage, "application/json")).toThrow(StillHiringDecodeError);
    expect(() => decodeSharedViewBody(garbage, "application/msgpack")).toThrow(/MessagePack/);
  });

  it("recognises a shared-view payload and rejects anything else", () => {
    expect(isSharedViewPayload(payload)).toBe(true);
    expect(isSharedViewPayload({ data: { table: { columns: [], rows: [] } } })).toBe(true);
    expect(isSharedViewPayload({ data: { table: { columns: [] } } })).toBe(false);
    expect(isSharedViewPayload({ msg: "data", data: "SUCCESS" })).toBe(false);
    expect(isSharedViewPayload(null)).toBe(false);
  });
});
