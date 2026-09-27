import { describe, it, expect } from "vitest";
import { normalizePkPhone, isValidPkPhone, pkPhoneSchema } from "@heybrew/shared";

describe("Pakistani phone normalize", () => {
  it("normalizes 03XXXXXXXXX to E.164", () => {
    expect(normalizePkPhone("03001234567")).toBe("+923001234567");
  });

  it("normalizes +923XXXXXXXXX", () => {
    expect(normalizePkPhone("+923001234567")).toBe("+923001234567");
  });

  it("normalizes 923XXXXXXXXX", () => {
    expect(normalizePkPhone("923001234567")).toBe("+923001234567");
  });

  it("rejects invalid numbers", () => {
    expect(normalizePkPhone("0211234567")).toBeNull();
    expect(normalizePkPhone("12345")).toBeNull();
    expect(isValidPkPhone("030012345")).toBe(false);
  });

  it("zod schema transforms to E.164", () => {
    expect(pkPhoneSchema.parse("03001234567")).toBe("+923001234567");
  });
});
