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
      basePath: "https://api.fireblocks.io/v1",
      poolConfig: { maxPoolSize: 2, idleTimeoutMs: 10000 },
    });
  });

  // Minimal valid params for each transaction type
  const minimalParams: Record<TransactionType, any> = {
    offerCreate: {
      sellAmount: { currency: "USD", issuer: "rIssuer", value: "1" },
      buyAmount: { currency: "BTC", issuer: "rIssuer", value: "0.00001" },
    },
    offerCancel: {
      offerSequence: 1,
    },
    crossCurrencyPayment: {
      destination: "rDest",
      amount: { currency: "USD", issuer: "rIssuer", value: "1" },
    },
    accountSet: {
      configs: {},
    },
    trustSet: {
      limitAmount: { currency: "USD", issuer: "rIssuer", value: "1" },
    },
    tokenTransfer: {
      destination: "rDest",
      amount: { currency: "USD", issuer: "rIssuer", value: "1" },
    },
    burnToken: {
      amount: { currency: "USD", issuer: "rIssuer", value: "1" },
    },
    freezeToken: {
      holder: "rHolder",
      currency: "USD",
      freeze: true,
    },
    clawback: {
      holder: "rHolder",
      currency: "USD",
      value: "1",
    },
    xrpTransfer: {
      destination: "rDest",
      amount: "1",
    },
  };

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

      const result = await service.executeTransaction({
        vaultAccountId: "vault123",
        transactionType: txType,
        params: minimalParams[txType],
      });

      expect(result).toEqual(mockResult);
      expect(mockGetSdk).toHaveBeenCalledWith("vault123");
      expect((mockSdkInstance as any)[method]).toHaveBeenCalledWith(
        minimalParams[txType]
      );
      expect(mockReleaseSdk).toHaveBeenCalledWith("vault123");
    }
  );

  it("executes XRP_TRANSFER with extracted fields", async () => {
    const result = { txId: "abc" };
    mockSdkInstance.xrpTransfer.mockResolvedValue(result);

    const params = minimalParams.xrpTransfer;

    const res = await service.executeTransaction({
      vaultAccountId: "vaultX",
      transactionType: TransactionType.XRP_TRANSFER,
      params,
    });

    expect(mockSdkInstance.xrpTransfer).toHaveBeenCalledWith(params);
    expect(res).toEqual(result);
    expect(mockReleaseSdk).toHaveBeenCalledWith("vaultX");
  });

  it("throws ValidationError for unknown transaction type", async () => {
    await expect(
      service.executeTransaction({
        vaultAccountId: "vault1",
        transactionType: "INVALID_TYPE" as TransactionType,
        params: minimalParams.offerCreate,
      })
    ).rejects.toThrow(ValidationError);

    expect(mockReleaseSdk).toHaveBeenCalledWith("vault1");
  });

  it("logs and throws error if SDK method fails", async () => {
    mockSdkInstance.trustSet.mockRejectedValue(new Error("Simulated failure"));

    await expect(
      service.executeTransaction({
        vaultAccountId: "vaultFail",
        transactionType: TransactionType.TRUST_SET,
        params: minimalParams.trustSet,
      })
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
