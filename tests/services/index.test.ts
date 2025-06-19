import * as Services from "../../src/services/index";

describe("services/index.ts exports", () => {
  it("should export DexService, SigningService, and TokenService", () => {
    expect(Services.DexService).toBeDefined();
    expect(typeof Services.DexService).toBe("function");
    expect(Services.SigningService).toBeDefined();
    expect(typeof Services.SigningService).toBe("function");
    expect(Services.TokenService).toBeDefined();
    expect(typeof Services.TokenService).toBe("function");
  });
});
