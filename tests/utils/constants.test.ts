// tests/constants.test.ts
import {
  XRP_LIMITS,
  TTL_CONST,
  MAX_DOMAIN_BYTES,
  XRPL_BURN_ADDRESS,
  TrustSetFlagValues,
} from "../../src/utils/constants";

describe("Constants", () => {
  it("should export correct XRP limits", () => {
    expect(XRP_LIMITS).toHaveProperty("MIN_XRP", "1");
    expect(XRP_LIMITS).toHaveProperty("MAX_XRP", "100000000000000000");
  });

  it("should export the correct TTL_CONST", () => {
    expect(TTL_CONST).toBe(20);
  });

  it("should export the correct MAX_DOMAIN_BYTES", () => {
    expect(MAX_DOMAIN_BYTES).toBe(256);
  });

  it("should export the correct XRPL_BURN_ADDRESS", () => {
    expect(XRPL_BURN_ADDRESS).toBe("rrrrrrrrrrrrrrrrrrrrBZbvji");
  });

  it("should map all TrustSet flag names to correct values", () => {
    expect(TrustSetFlagValues.tfSetfAuth).toBe(0x00010000);
    expect(TrustSetFlagValues.tfSetNoRipple).toBe(0x00020000);
    expect(TrustSetFlagValues.tfClearNoRipple).toBe(0x00040000);
    expect(TrustSetFlagValues.tfSetFreeze).toBe(0x00100000);
    expect(TrustSetFlagValues.tfClearFreeze).toBe(0x00200000);
  });

  it("should have no unexpected keys in TrustSetFlagValues", () => {
    expect(Object.keys(TrustSetFlagValues).sort()).toEqual(
      [
        "tfSetfAuth",
        "tfSetNoRipple",
        "tfClearNoRipple",
        "tfSetFreeze",
        "tfClearFreeze",
      ].sort()
    );
  });
});
