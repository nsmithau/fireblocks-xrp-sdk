// tests/api/ApiService.test.ts
import { FbksXrpApiService } from "../../src/api/ApiService";
import { TransactionType } from "../../src/pool/types";
import { ValidationError } from "../../src/errors/errors";
import { SdkManager } from "../../src/pool/SdkManager";

// Mocks
jest.mock("../../src/pool/SdkManager");
jest.mock("../../src/FireblocksXrpSdk");

const mockSdkInstance = {
  offerCreate: jest.fn(),
  offerCancel: jest.fn(),
  crossCurrencyPayment: jest.fn(),
  accountSet: jest.fn(),
  trustSet: jest.fn(),
  tokenTransfer: jest.fn(),
  burnToken: jest.fn(),
  freezeToken: jest.fn(),
  clawback: jest.fn(),
  xrpTransfer: jest.fn(),
};

const mockGetSdk = jest.fn();
const mockReleaseSdk = jest.fn();
const mockShutdown = jest.fn();
const mockGetMetrics = jest.fn();

(SdkManager as jest.Mock).mockImplementation(() => ({
  getSdk: mockGetSdk,
  releaseSdk: mockReleaseSdk,
  shutdown: mockShutdown,
  getMetrics: mockGetMetrics,
}));

describe("FbksXrpApiService", () => {
  let service: FbksXrpApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSdk.mockResolvedValue(mockSdkInstance);
    service = new FbksXrpApiService({
      apiKey: "key",
      apiSecret: "secret",
      assetId: "XRP_TEST",
      basePath: "US",
      poolConfig: { maxPoolSize: 2, idleTimeoutMs: 10000 },
    });
  });

  const testCases = [
    [TransactionType.OFFER_CREATE, "offerCreate"],
    [TransactionType.OFFER_CANCEL, "offerCancel"],
    [TransactionType.CROSS_CURRENCY_PAYMENT, "crossCurrencyPayment"],
    [TransactionType.ACCOUNT_SET, "accountSet"],
    [TransactionType.TRUST_SET, "trustSet"],
    [TransactionType.TOKEN_TRANSFER, "tokenTransfer"],
    [TransactionType.BURN_TOKEN, "burnToken"],
    [TransactionType.FREEZE_TOKEN, "freezeToken"],
    [TransactionType.CLAWBACK, "clawback"],
  ] as const;

  test.each(testCases)(
    "executes %s via the corresponding SDK method",
    async (txType, method) => {
      const mockResult = { success: true };
      (mockSdkInstance as any)[method].mockResolvedValueOnce(mockResult);

      const result = await service.executeTransaction("vault123", txType, {
        foo: "bar",
      });

      expect(result).toEqual(mockResult);
      expect(mockGetSdk).toHaveBeenCalledWith("vault123");
      expect((mockSdkInstance as any)[method]).toHaveBeenCalledWith({
        foo: "bar",
      });
      expect(mockReleaseSdk).toHaveBeenCalledWith("vault123");
    }
  );

  it("executes XRP_TRANSFER with extracted fields", async () => {
    const result = { txId: "abc" };
    mockSdkInstance.xrpTransfer.mockResolvedValue(result);

    const params = {
      destination: "rXYZ",
      amount: "123",
      note: "memo",
    };

    const res = await service.executeTransaction(
      "vaultX",
      TransactionType.XRP_TRANSFER,
      params
    );

    expect(mockSdkInstance.xrpTransfer).toHaveBeenCalledWith(params);
    expect(res).toEqual(result);
    expect(mockReleaseSdk).toHaveBeenCalledWith("vaultX");
  });

  it("throws ValidationError for unknown transaction type", async () => {
    await expect(
      service.executeTransaction(
        "vault1",
        "INVALID_TYPE" as TransactionType,
        {}
      )
    ).rejects.toThrow(ValidationError);

    expect(mockReleaseSdk).toHaveBeenCalledWith("vault1");
  });

  it("logs and throws error if SDK method fails", async () => {
    mockSdkInstance.trustSet.mockRejectedValue(new Error("Simulated failure"));

    await expect(
      service.executeTransaction("vaultFail", TransactionType.TRUST_SET, {})
    ).rejects.toThrow("Simulated failure");

    expect(mockReleaseSdk).toHaveBeenCalledWith("vaultFail");
  });

  it("getPoolMetrics proxies to sdkManager", () => {
    mockGetMetrics.mockReturnValue({ idle: 1 });
    expect(service.getPoolMetrics()).toEqual({ idle: 1 });
  });

  it("shutdown proxies to sdkManager", async () => {
    await service.shutdown();
    expect(mockShutdown).toHaveBeenCalled();
  });
});
