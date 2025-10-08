import { TransactionType } from "../../src/pool/types";
import { OracleSetOpts } from "../../src/config/types";

// Mock the problematic dependencies
jest.mock("ripple-binary-codec", () => ({
  encode: jest.fn(),
  decode: jest.fn(),
}));

// Mock the FireblocksXrpSdk class
const mockOracleSet = jest.fn();
const mockOracleDelete = jest.fn();

jest.mock("../../src/FireblocksXrpSdk", () => ({
  FireblocksXrpSdk: jest.fn().mockImplementation(() => ({
    oracleSet: mockOracleSet,
    oracleDelete: mockOracleDelete,
  })),
}));

// Mock the SdkManager
const mockGetSdk = jest.fn();
const mockReleaseSdk = jest.fn();
const mockShutdown = jest.fn();
const mockGetMetrics = jest.fn();

jest.mock("../../src/pool/SdkManager", () => ({
  SdkManager: jest.fn().mockImplementation(() => ({
    getSdk: mockGetSdk,
    releaseSdk: mockReleaseSdk,
    shutdown: mockShutdown,
    getMetrics: mockGetMetrics,
  })),
}));

// Now import the ApiService after mocking
import { FbksXrpApiService } from "../../src/api/ApiService";

describe("OracleSet Integration Tests", () => {
  let service: FbksXrpApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSdk.mockResolvedValue({
      oracleSet: mockOracleSet,
      oracleDelete: mockOracleDelete,
    });
    
    service = new FbksXrpApiService({
      apiKey: "test-key",
      apiSecret: "test-secret",
      assetId: "XRP_TEST",
      basePath: "https://api.fireblocks.io/v1",
      poolConfig: { maxPoolSize: 2, idleTimeoutMs: 10000 },
    });
  });

  it("should execute OracleSet transaction successfully", async () => {
    const mockResult = { 
      result: { 
        hash: "test-hash-123",
        meta: { TransactionResult: "tesSUCCESS" }
      }
    };
    mockOracleSet.mockResolvedValueOnce(mockResult);

    const params: OracleSetOpts = {
      OracleDocumentID: 34,
      Provider: "70726F7669646572", // "provider" in hex
      LastUpdateTime: Math.floor(Date.now() / 1000),
      AssetClass: "63757272656E6379", // "currency" in hex
      PriceDataSeries: [
        {
          PriceData: {
            BaseAsset: "XRP",
            QuoteAsset: "USD",
            AssetPrice: "2850", // 2850 with scale 3 = 2.850 (current market price)
            Scale: 3,
          },
        },
        {
          PriceData: {
            BaseAsset: "BTC",
            QuoteAsset: "USD",
            AssetPrice: "121424000", // 121424000 with scale 3 = 121424.000 (current market price)
            Scale: 3,
          },
        },
      ],
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_SET,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockGetSdk).toHaveBeenCalledWith("vault123");
    expect(mockOracleSet).toHaveBeenCalledWith(params);
    expect(mockReleaseSdk).toHaveBeenCalledWith("vault123");
  });

  it("should handle OracleSet with minimal required fields", async () => {
    const mockResult = { 
      result: { 
        hash: "minimal-hash-456",
        meta: { TransactionResult: "tesSUCCESS" }
      }
    };
    mockOracleSet.mockResolvedValueOnce(mockResult);

    const params: OracleSetOpts = {
      OracleDocumentID: 1,
      LastUpdateTime: Math.floor(Date.now() / 1000),
      PriceDataSeries: [
        {
          PriceData: {
            BaseAsset: "XRP",
            QuoteAsset: "USD",
            AssetPrice: "1000",
            Scale: 3,
          },
        },
      ],
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault456",
      transactionType: TransactionType.ORACLE_SET,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleSet).toHaveBeenCalledWith(params);
  });

  it("should handle OracleSet transaction failure", async () => {
    const error = new Error("OracleSet transaction failed");
    mockOracleSet.mockRejectedValueOnce(error);

    const params: OracleSetOpts = {
      OracleDocumentID: 999,
      LastUpdateTime: Math.floor(Date.now() / 1000),
      PriceDataSeries: [
        {
          PriceData: {
            BaseAsset: "INVALID",
            QuoteAsset: "USD",
            AssetPrice: "100",
            Scale: 2,
          },
        },
      ],
    };

    await expect(
      service.executeTransaction({
        vaultAccountId: "vault999",
        transactionType: TransactionType.ORACLE_SET,
        params,
      })
    ).rejects.toThrow("OracleSet transaction failed");

    expect(mockReleaseSdk).toHaveBeenCalledWith("vault999");
  });

  it("should handle OracleSet with empty PriceDataSeries", async () => {
    const mockResult = { 
      result: { 
        hash: "empty-series-hash",
        meta: { TransactionResult: "temARRAY_EMPTY" }
      }
    };
    mockOracleSet.mockResolvedValueOnce(mockResult);

    const params: OracleSetOpts = {
      OracleDocumentID: 1,
      LastUpdateTime: Math.floor(Date.now() / 1000),
      PriceDataSeries: [], // Empty array should trigger temARRAY_EMPTY
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault-empty",
      transactionType: TransactionType.ORACLE_SET,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleSet).toHaveBeenCalledWith(params);
  });

  it("should handle OracleSet with too many PriceDataSeries", async () => {
    const mockResult = { 
      result: { 
        hash: "too-many-hash",
        meta: { TransactionResult: "tecARRAY_TOO_LARGE" }
      }
    };
    mockOracleSet.mockResolvedValueOnce(mockResult);

    // Create 11 PriceData objects (exceeds the 10 limit)
    const priceDataSeries = Array.from({ length: 11 }, (_, i) => ({
      PriceData: {
        BaseAsset: `TOKEN${i}`,
        QuoteAsset: "USD",
        AssetPrice: "100",
        Scale: 2,
      },
    }));

    const params: OracleSetOpts = {
      OracleDocumentID: 1,
      LastUpdateTime: Math.floor(Date.now() / 1000),
      PriceDataSeries: priceDataSeries,
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault-too-many",
      transactionType: TransactionType.ORACLE_SET,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleSet).toHaveBeenCalledWith(params);
  });

  it("should handle OracleSet with invalid update time", async () => {
    const mockResult = { 
      result: { 
        hash: "invalid-time-hash",
        meta: { TransactionResult: "tecINVALID_UPDATE_TIME" }
      }
    };
    mockOracleSet.mockResolvedValueOnce(mockResult);

    const params: OracleSetOpts = {
      OracleDocumentID: 1,
      LastUpdateTime: Math.floor(Date.now() / 1000) - 400, // More than 300 seconds ago
      PriceDataSeries: [
        {
          PriceData: {
            BaseAsset: "XRP",
            QuoteAsset: "USD",
            AssetPrice: "100",
            Scale: 2,
          },
        },
      ],
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault-invalid-time",
      transactionType: TransactionType.ORACLE_SET,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleSet).toHaveBeenCalledWith(params);
  });

  it("should handle different scale values correctly", async () => {
    const mockResult = { 
      result: { 
        hash: "scale-test-hash",
        meta: { TransactionResult: "tesSUCCESS" }
      }
    };
    mockOracleSet.mockResolvedValueOnce(mockResult);

    const params: OracleSetOpts = {
      OracleDocumentID: 1,
      LastUpdateTime: Math.floor(Date.now() / 1000),
      PriceDataSeries: [
        {
          PriceData: {
            BaseAsset: "XRP",
            QuoteAsset: "USD",
            AssetPrice: "100", // 1.00 with scale 2
            Scale: 2,
          },
        },
        {
          PriceData: {
            BaseAsset: "BTC",
            QuoteAsset: "USD",
            AssetPrice: "50000000", // 50000.000 with scale 3
            Scale: 3,
          },
        },
        {
          PriceData: {
            BaseAsset: "ETH",
            QuoteAsset: "USD",
            AssetPrice: "3000000000", // 3000.000000 with scale 6
            Scale: 6,
          },
        },
      ],
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault-scale-test",
      transactionType: TransactionType.ORACLE_SET,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleSet).toHaveBeenCalledWith(params);
  });

  it("should handle OracleSet without AssetPrice (for deletion)", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-price-hash",
        meta: { TransactionResult: "tesSUCCESS" }
      }
    };
    mockOracleSet.mockResolvedValueOnce(mockResult);

    const params: OracleSetOpts = {
      OracleDocumentID: 1,
      LastUpdateTime: Math.floor(Date.now() / 1000),
      PriceDataSeries: [
        {
          PriceData: {
            BaseAsset: "XRP",
            QuoteAsset: "USD",
            // No AssetPrice or Scale - this deletes the price pair
          },
        },
      ],
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault-delete-price",
      transactionType: TransactionType.ORACLE_SET,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleSet).toHaveBeenCalledWith(params);
  });

  it("should handle OracleSet with all optional fields", async () => {
    const mockResult = { 
      result: { 
        hash: "full-hash-789",
        meta: { TransactionResult: "tesSUCCESS" }
      }
    };
    mockOracleSet.mockResolvedValueOnce(mockResult);

    const params: OracleSetOpts = {
      OracleDocumentID: 100,
      Provider: "436861696E6C696E6B", // "Chainlink" in hex
      URI: "68747470733A2F2F6170692E636861696E6C696E6B2E636F6D", // "https://api.chainlink.com" in hex
      LastUpdateTime: Math.floor(Date.now() / 1000),
      AssetClass: "636F6D6D6F64697479", // "commodity" in hex
      PriceDataSeries: [
        {
          PriceData: {
            BaseAsset: "GOLD",
            QuoteAsset: "USD",
            AssetPrice: "2000000", // 2000 with scale 3
            Scale: 3,
          },
        },
        {
          PriceData: {
            BaseAsset: "SILVER",
            QuoteAsset: "USD",
            AssetPrice: "25000", // 25 with scale 3
            Scale: 3,
          },
        },
      ],
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault789",
      transactionType: TransactionType.ORACLE_SET,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleSet).toHaveBeenCalledWith(params);
  });
});
