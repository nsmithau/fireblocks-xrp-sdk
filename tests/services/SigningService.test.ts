// tests/signing.service.test.ts
import { SigningService } from "../../src/services";
import { SigningError } from "../../src/errors/errors";
import { Fireblocks, TransactionStateEnum } from "@fireblocks/ts-sdk";
import { Wallet } from "xrpl";

// Mocks
jest.mock("@fireblocks/ts-sdk", () => ({
  Fireblocks: jest.fn().mockImplementation(() => ({
    transactions: {
      createTransaction: jest.fn(),
      getTransaction: jest.fn(),
    },
  })),
  TransactionStateEnum: {
    Submitted: "SUBMITTED",
    Completed: "COMPLETED",
    Failed: "FAILED",
    Blocked: "BLOCKED",
    Cancelled: "CANCELLED",
    Rejected: "REJECTED",
  },
}));

jest.mock("ripple-binary-codec", () => ({
  encode: jest.fn(() => "encodedTx"),
  decode: jest.fn(() => ({
    TransactionType: "Payment",
    TxnSignature: "mockSignature",
  })),
}));

jest.mock("xrpl/dist/npm/utils/hashes", () => ({
  hashSignedTx: jest.fn(() => "signedTxHash"),
  hashTx: jest.fn(() => "unsignedTxHash"),
}));

const fakeWallet = {
  classicAddress: "rClassicAddress",
  publicKey: "FakePublicKey",
} as unknown as Wallet;

const fakeFireblocks = new Fireblocks({
  apiKey: "apiKey",
  secretKey: "apiSecret",
});

describe("SigningService", () => {
  let service: SigningService;

  beforeEach(() => {
    service = new SigningService(fakeFireblocks, fakeWallet as any);
    jest.clearAllMocks();
  });

  describe("sign", () => {
    it("prepares unsigned transaction (single sig)", () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey");
      expect(result.tx_blob).toMatch(/^prepared:/);
      expect(result.hash).toMatch(/^hash:/);
    });

    it("prepares unsigned transaction (multisig string)", () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey", "rMultisigAddress");
      expect(result.tx_blob).toMatch(/^prepared:/);
      expect(result.hash).toMatch(/^hash:/);
    });

    it("prepares unsigned transaction (multisig true)", () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey", true);
      expect(result.tx_blob).toMatch(/^prepared:/);
      expect(result.hash).toMatch(/^hash:/);
    });

    it("throws if transaction already signed (TxnSignature)", () => {
      const tx: any = { TxnSignature: "signature" };
      expect(() => service.sign(tx, "FakePublicKey")).toThrow(SigningError);
    });

    it("throws if transaction already signed (Signers)", () => {
      const tx: any = { Signers: [{ Signer: {} }] };
      expect(() => service.sign(tx, "FakePublicKey")).toThrow(SigningError);
    });
  });

  describe("signAsync", () => {
    it("calls sign and getSignedTransaction and returns result", async () => {
      const tx: any = { TransactionType: "Payment" };
      const signSpy = jest.spyOn(service, "sign").mockReturnValue({
        tx_blob: "prepared:fakeId",
        hash: "hash:fakeId",
      });
      const getSignedTransactionSpy = jest
        .spyOn(service, "getSignedTransaction")
        .mockResolvedValue({ tx_blob: "signedBlob", hash: "signedHash" });

      const result = await service.signAsync(
        tx,
        "FakePublicKey",
        "ASSET",
        "VAULT",
        "Some note"
      );
      expect(signSpy).toHaveBeenCalled();
      expect(getSignedTransactionSpy).toHaveBeenCalled();
      expect(result).toEqual({ tx_blob: "signedBlob", hash: "signedHash" });
    });

    it("throws SigningError for errors in flow", async () => {
      jest.spyOn(service, "sign").mockImplementation(() => {
        throw new Error("random fail");
      });
      const tx = { TransactionType: "Payment" } as any;
      await expect(
        service.signAsync(tx, "FakePublicKey", "ASSET", "VAULT")
      ).rejects.toThrow(SigningError);
    });
  });

  describe("waitForSignature", () => {
    it("throws if transaction ID is undefined", async () => {
      const mockTx = { id: undefined };
      await expect(service.waitForSignature(mockTx)).rejects.toThrow(
        SigningError
      );
    });

    it("polls until transaction is completed", async () => {
      const mockTx = { id: "test-id" };

      // Mock progression: Submitted -> Completed
      jest
        .spyOn(fakeFireblocks.transactions, "getTransaction")
        .mockResolvedValueOnce({
          statusCode: 200,
          headers: {},
          data: { id: "test-id", status: TransactionStateEnum.Submitted },
        })
        .mockResolvedValueOnce({
          statusCode: 200,
          headers: {},
          data: { id: "test-id", status: TransactionStateEnum.Completed },
        });

      const result = await service.waitForSignature(mockTx, 100); // Fast polling for tests
      expect(result.status).toBe(TransactionStateEnum.Completed);
      expect(fakeFireblocks.transactions.getTransaction).toHaveBeenCalledTimes(
        2
      );
    });

    it("throws for failed transaction states", async () => {
      const mockTx = { id: "test-id" };

      jest
        .spyOn(fakeFireblocks.transactions, "getTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "test-id", status: TransactionStateEnum.Failed },
        });

      await expect(service.waitForSignature(mockTx)).rejects.toThrow(
        SigningError
      );
    });

    it("throws for blocked transaction states", async () => {
      const mockTx = { id: "test-id" };

      jest
        .spyOn(fakeFireblocks.transactions, "getTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "test-id", status: TransactionStateEnum.Blocked },
        });

      await expect(service.waitForSignature(mockTx)).rejects.toThrow(
        SigningError
      );
    });

    it("throws for cancelled transaction states", async () => {
      const mockTx = { id: "test-id" };

      jest
        .spyOn(fakeFireblocks.transactions, "getTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "test-id", status: TransactionStateEnum.Cancelled },
        });

      await expect(service.waitForSignature(mockTx)).rejects.toThrow(
        SigningError
      );
    });

    it("throws for rejected transaction states", async () => {
      const mockTx = { id: "test-id" };

      jest
        .spyOn(fakeFireblocks.transactions, "getTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "test-id", status: TransactionStateEnum.Rejected },
        });

      await expect(service.waitForSignature(mockTx)).rejects.toThrow(
        SigningError
      );
    });

    it("wraps non-SigningError exceptions", async () => {
      const mockTx = { id: "test-id" };

      jest
        .spyOn(fakeFireblocks.transactions, "getTransaction")
        .mockRejectedValue(new Error("Network error"));

      await expect(service.waitForSignature(mockTx)).rejects.toThrow(
        SigningError
      );
    });
  });

  describe("getSignedTransaction", () => {
    it("throws if placeholder is not valid", async () => {
      await expect(
        service.getSignedTransaction(
          { tx_blob: "not-prepared:123", hash: "hash:123" },
          "ASSET",
          "VAULT",
          ""
        )
      ).rejects.toThrow(SigningError);
    });

    it("throws if placeholder transaction is expired/missing", async () => {
      await expect(
        service.getSignedTransaction(
          { tx_blob: "prepared:missing", hash: "hash:missing" },
          "ASSET",
          "VAULT",
          ""
        )
      ).rejects.toThrow(SigningError);
    });

    it("throws if Fireblocks returns no signature", async () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey");
      jest
        .spyOn(fakeFireblocks.transactions, "createTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "txid" },
        });
      jest
        .spyOn(service as any, "waitForSignature")
        .mockResolvedValue({ signedMessages: [undefined] });

      await expect(
        service.getSignedTransaction(result, "ASSET", "VAULT", "note")
      ).rejects.toThrow(SigningError);
    });

    it("throws SigningError if Fireblocks throws", async () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey");
      jest
        .spyOn(fakeFireblocks.transactions, "createTransaction")
        .mockRejectedValue(new Error("fireblocks fail"));

      await expect(
        service.getSignedTransaction(result, "ASSET", "VAULT", "note")
      ).rejects.toThrow(SigningError);
    });

    it("successfully creates single signature transaction", async () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey"); // No multisig

      jest
        .spyOn(fakeFireblocks.transactions, "createTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "txid" },
        });

      jest.spyOn(service, "waitForSignature").mockResolvedValue({
        signedMessages: [
          {
            signature: { r: "1234567890abcdef", s: "fedcba0987654321" },
          },
        ],
      });

      const signed = await service.getSignedTransaction(
        result,
        "ASSET",
        "VAULT",
        "note"
      );

      expect(signed.tx_blob).toBe("encodedTx");
      expect(signed.hash).toBe("signedTxHash");
      expect(signed.tx_blob).not.toMatch(/^prepared:/);
      expect(signed.hash).not.toMatch(/^hash:/);
    });

    it("successfully creates multisig transaction with string address", async () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey", "rMultisigAddress");

      jest
        .spyOn(fakeFireblocks.transactions, "createTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "txid" },
        });

      jest.spyOn(service, "waitForSignature").mockResolvedValue({
        signedMessages: [
          {
            signature: { r: "abcdef1234567890", s: "0987654321fedcba" },
          },
        ],
      });

      const signed = await service.getSignedTransaction(
        result,
        "ASSET",
        "VAULT",
        "note"
      );

      expect(signed.tx_blob).toBe("encodedTx");
      expect(signed.hash).toBe("signedTxHash");
    });

    it("successfully creates multisig transaction with boolean true", async () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey", true);

      jest
        .spyOn(fakeFireblocks.transactions, "createTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "txid" },
        });

      jest.spyOn(service, "waitForSignature").mockResolvedValue({
        signedMessages: [
          {
            signature: { r: "def123abc789", s: "789abc123def" },
          },
        ],
      });

      const signed = await service.getSignedTransaction(
        result,
        "ASSET",
        "VAULT",
        "note"
      );

      expect(signed.tx_blob).toBe("encodedTx");
      expect(signed.hash).toBe("signedTxHash");
    });

    it("handles DER encoding with edge case values", async () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey");

      jest
        .spyOn(fakeFireblocks.transactions, "createTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "txid" },
        });

      // Test with signature values that trigger DER encoding edge cases
      jest.spyOn(service, "waitForSignature").mockResolvedValue({
        signedMessages: [
          {
            signature: {
              r: "80abcdef12345678", // Starts with 0x80 (high bit set)
              s: "00fedcba98765432", // Starts with 0x00 (padding case)
            },
          },
        ],
      });

      const signed = await service.getSignedTransaction(
        result,
        "ASSET",
        "VAULT",
        "note"
      );

      expect(signed.tx_blob).toBe("encodedTx");
      expect(signed.hash).toBe("signedTxHash");
    });

    it("validates transaction serialization", async () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey");

      jest
        .spyOn(fakeFireblocks.transactions, "createTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "txid" },
        });

      jest.spyOn(service, "waitForSignature").mockResolvedValue({
        signedMessages: [
          {
            signature: { r: "1234", s: "5678" },
          },
        ],
      });

      // Mock decode to return transaction with signature (valid serialization)
      const mockDecode = require("ripple-binary-codec").decode;
      mockDecode.mockReturnValue({
        TransactionType: "Payment",
        TxnSignature: "mockSignature",
      });

      const signed = await service.getSignedTransaction(
        result,
        "ASSET",
        "VAULT",
        "note"
      );

      expect(signed.tx_blob).toBe("encodedTx");
      expect(mockDecode).toHaveBeenCalledWith("encodedTx");
    });

    it("throws if serialization validation fails", async () => {
      const tx: any = { TransactionType: "Payment" };
      const result = service.sign(tx, "FakePublicKey");

      jest
        .spyOn(fakeFireblocks.transactions, "createTransaction")
        .mockResolvedValue({
          statusCode: 200,
          headers: {},
          data: { id: "txid" },
        });

      jest.spyOn(service, "waitForSignature").mockResolvedValue({
        signedMessages: [
          {
            signature: { r: "1234", s: "5678" },
          },
        ],
      });

      // Mock decode to return transaction without signature (invalid serialization)
      const mockDecode = require("ripple-binary-codec").decode;
      mockDecode.mockReturnValue({
        TransactionType: "Payment",
        // Missing TxnSignature or Signers
      });

      await expect(
        service.getSignedTransaction(result, "ASSET", "VAULT", "note")
      ).rejects.toThrow(SigningError);
    });
  });
});
