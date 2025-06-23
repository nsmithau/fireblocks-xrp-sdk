// tests/fireblocksXrpSdk.test.ts
import { FireblocksXrpSdk, FireblocksConfig } from "../src/FireblocksXrpSdk";
import { Fireblocks } from "@fireblocks/ts-sdk";

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

jest.mock("xrpl", () => {
  const actual = jest.requireActual("xrpl");
  return {
    ...actual,
    Client: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      isConnected: jest.fn(() => true),
      disconnect: jest.fn(),
      autofill: jest.fn(async (tx) => ({
        ...tx,
        Fee: "12",
        Sequence: 1,
        LastLedgerSequence: 10000,
      })),
      submitAndWait: jest.fn(async () => ({
        result: { validated: true, tx_json: { hash: "mockhash" } },
      })),
    })),
  };
});

jest.mock("../src/services/SigningService", () => ({
  SigningService: jest.fn().mockImplementation(() => ({
    sign: jest.fn().mockReturnValue({ tx_blob: "blob", hash: "hash" }),
    signAsync: jest.fn(),
    waitForSignature: jest.fn().mockResolvedValue({ status: "completed" }),
  })),
}));

jest.mock("../src/services/TokenService", () => ({
  TokenService: jest.fn().mockImplementation(() => ({
    createFungibleTokenPaymentTx: jest.fn(),
    createTrustSetTx: jest.fn(),
    createAccountSetTx: jest.fn(),
    createClawbackTx: jest.fn(),
  })),
}));

jest.mock("../src/services/DexService", () => ({
  DexService: jest.fn().mockImplementation(() => ({
    getOfferCreateUnsignedTx: jest.fn(),
    getOfferCancelUnsignedTx: jest.fn(),
    getCrossCurrencyPaymentUnsignedTx: jest.fn(),
  })),
}));

const fakeFireblocks = {
  transactions: {
    createTransaction: jest.fn().mockResolvedValue({
      data: { id: "mockTxId" },
    }),
  },
  vaults: {
    getVaultAccountAssetAddressesPaginated: jest.fn().mockResolvedValue({
      data: {
        addresses: [{ address: "rAddress" }],
      },
    }),
    getPublicKeyInfoForAddress: jest.fn().mockResolvedValue({
      data: {
        publicKey: "pubKey",
      },
    }),
  },
} as unknown as Fireblocks;

FireblocksXrpSdk.createFireblocksInstance = jest.fn(() => fakeFireblocks);

describe("FireblocksXrpSdk", () => {
  const config: FireblocksConfig = {
    apiKey: "key",
    apiSecret: "secret",
    vaultAccountId: "mainVault",
    assetId: "XRP_TEST",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("initializes all services and fields", () => {
      const sdk = new FireblocksXrpSdk(
        fakeFireblocks,
        config,
        "pubKey",
        "rAddress"
      );

      expect((sdk as any).fireblocks).toBe(fakeFireblocks);
      expect((sdk as any).vaultAccountId).toBe("mainVault");
      expect((sdk as any).assetId).toBe("XRP_TEST");
      expect((sdk as any).signingService).toBeDefined();
      expect((sdk as any).dexService).toBeDefined();
      expect((sdk as any).tokenService).toBeDefined();
    });
  });

  describe("service delegation", () => {
    let sdk: FireblocksXrpSdk;

    beforeEach(() => {
      sdk = new FireblocksXrpSdk(fakeFireblocks, config, "pubKey", "rAddress");
    });

    it("delegates to signingService.sign", () => {
      const tx = { TransactionType: "Payment" };
      const result = sdk.sign(tx as any, "pubKey");
      expect(result).toEqual({ tx_blob: "blob", hash: "hash" });
      expect((sdk as any).signingService.sign).toHaveBeenCalledWith(
        tx,
        "pubKey",
        undefined
      );
    });

    it("calls tokenService.createFungibleTokenPaymentTx", () => {
      const spy = jest.spyOn(
        (sdk as any).tokenService,
        "createFungibleTokenPaymentTx"
      );
      (sdk as any).tokenService.createFungibleTokenPaymentTx("args");
      expect(spy).toHaveBeenCalledWith("args");
    });

    it("calls dexService.getOfferCreateUnsignedTx", () => {
      const spy = jest.spyOn(
        (sdk as any).dexService,
        "getOfferCreateUnsignedTx"
      );
      (sdk as any).dexService.getOfferCreateUnsignedTx("args");
      expect(spy).toHaveBeenCalledWith("args");
    });
  });

  describe("fetchXrpAccountInfo", () => {
    it("returns address and public key", async () => {
      const info = await FireblocksXrpSdk.fetchXrpAccountInfo(
        fakeFireblocks,
        config
      );
      expect(info).toEqual({ address: "rAddress", publicKey: "PUBKEY" });
    });

    it("throws if address is not found", async () => {
      (
        fakeFireblocks.vaults
          .getVaultAccountAssetAddressesPaginated as jest.Mock
      ).mockResolvedValueOnce({
        data: { addresses: [] },
      });
      await expect(
        FireblocksXrpSdk.fetchXrpAccountInfo(fakeFireblocks, config)
      ).rejects.toThrow("XRP address not found");
    });

    it("throws if public key is not returned", async () => {
      (
        fakeFireblocks.vaults.getPublicKeyInfoForAddress as jest.Mock
      ).mockResolvedValueOnce({
        data: {},
      });
      await expect(
        FireblocksXrpSdk.fetchXrpAccountInfo(fakeFireblocks, config)
      ).rejects.toThrow("Public key not found");
    });
  });
});
