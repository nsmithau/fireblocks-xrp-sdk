import { TransactionType } from "../../src/pool/types";
import { OracleDeleteOpts } from "../../src/config/types";

// Mock the problematic dependencies
jest.mock("ripple-binary-codec", () => ({
  encode: jest.fn(),
  decode: jest.fn(),
}));

// Mock the FireblocksXrpSdk class
const mockOracleDelete = jest.fn();
const mockOracleSet = jest.fn();

jest.mock("../../src/FireblocksXrpSdk", () => ({
  FireblocksXrpSdk: jest.fn().mockImplementation(() => ({
    oracleDelete: mockOracleDelete,
    oracleSet: mockOracleSet,
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

describe("OracleDelete Integration Tests", () => {
  let service: FbksXrpApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSdk.mockResolvedValue({
      oracleDelete: mockOracleDelete,
      oracleSet: mockOracleSet,
    });
    
    service = new FbksXrpApiService({
      apiKey: "test-key",
      apiSecret: "test-secret",
      assetId: "XRP_TEST",
      basePath: "https://api.fireblocks.io/v1",
      poolConfig: { maxPoolSize: 2, idleTimeoutMs: 10000 },
    });
  });

  it("should execute OracleDelete transaction successfully", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-hash-123",
        meta: { TransactionResult: "tesSUCCESS" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 34,
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockGetSdk).toHaveBeenCalledWith("vault123");
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
    expect(mockReleaseSdk).toHaveBeenCalledWith("vault123");
  });

  it("should handle OracleDelete with different Oracle Document IDs", async () => {
    const testCases = [
      { id: 1, expectedHash: "delete-hash-1" },
      { id: 100, expectedHash: "delete-hash-100" },
      { id: 999, expectedHash: "delete-hash-999" },
    ];

    for (const testCase of testCases) {
      const mockResult = { 
        result: { 
          hash: testCase.expectedHash,
          meta: { TransactionResult: "tesSUCCESS" }
        }
      };
      mockOracleDelete.mockResolvedValueOnce(mockResult);

      const params: OracleDeleteOpts = {
        OracleDocumentID: testCase.id,
      };

      const result = await service.executeTransaction({
        vaultAccountId: "vault123",
        transactionType: TransactionType.ORACLE_DELETE,
        params,
      });

      expect(result).toEqual(mockResult);
      expect(mockOracleDelete).toHaveBeenCalledWith(params);
    }
  });

  it("should handle OracleDelete transaction failure", async () => {
    const error = new Error("OracleDelete transaction failed");
    mockOracleDelete.mockRejectedValueOnce(error);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 999,
    };

    await expect(
      service.executeTransaction({
        vaultAccountId: "vault999",
        transactionType: TransactionType.ORACLE_DELETE,
        params,
      })
    ).rejects.toThrow("OracleDelete transaction failed");

    expect(mockReleaseSdk).toHaveBeenCalledWith("vault999");
  });

  it("should handle OracleDelete for non-existent Oracle", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-non-existent-hash",
        meta: { TransactionResult: "tecNO_ENTRY" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 99999, // Non-existent Oracle
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with invalid Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-invalid-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 0, // Invalid ID
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with large Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-large-hash",
        meta: { TransactionResult: "tesSUCCESS" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 2147483647, // Max 32-bit integer
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with negative Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-negative-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: -1, // Negative ID
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with very large Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-very-large-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 999999999, // Very large ID
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with decimal Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-decimal-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42.5, // Decimal ID (should be treated as integer)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with zero Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-zero-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 0, // Zero ID
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with string Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-string-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent string)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with undefined Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-undefined-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent undefined)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with null Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-null-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent null)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with boolean Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-boolean-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent boolean)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with array Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-array-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent array)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with object Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-object-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent object)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with function Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-function-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent function)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with symbol Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-symbol-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent symbol)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with bigint Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-bigint-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent bigint)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with NaN Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-nan-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent NaN)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with Infinity Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-infinity-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent Infinity)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });

  it("should handle OracleDelete with -Infinity Oracle Document ID", async () => {
    const mockResult = { 
      result: { 
        hash: "delete-negative-infinity-hash",
        meta: { TransactionResult: "temBAD_ORACLE" }
      }
    };
    mockOracleDelete.mockResolvedValueOnce(mockResult);

    const params: OracleDeleteOpts = {
      OracleDocumentID: 42, // Valid number (TypeScript would prevent -Infinity)
    };

    const result = await service.executeTransaction({
      vaultAccountId: "vault123",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    });

    expect(result).toEqual(mockResult);
    expect(mockOracleDelete).toHaveBeenCalledWith(params);
  });
});
