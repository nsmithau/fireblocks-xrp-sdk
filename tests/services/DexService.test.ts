// tests/services/dex.service.test.ts
import { DexService } from "../../src/services";
import { ValidationError } from "../../src/errors/errors";
import {
  deriveOfferCreateFlags,
  derivePaymentFlags,
  validateAmount,
  validateMemos,
} from "../../src/utils/utils";
import { Amount, Memo, Path } from "xrpl";
import { IPaymentFlags } from "../../src/config/types";

jest.mock("../../src/utils/utils", () => ({
  ...jest.requireActual("../../src/utils/utils"),
  deriveOfferCreateFlags: jest.fn(),
  derivePaymentFlags: jest.fn(),
  validateAmount: jest.fn(),
  validateMemos: jest.fn((memos) => memos),
}));

const mockDeriveOfferCreateFlags = deriveOfferCreateFlags as jest.Mock;
const mockDerivePaymentFlags = derivePaymentFlags as jest.Mock;
const mockValidateAmount = validateAmount as jest.Mock;
const mockValidateMemos = validateMemos as jest.Mock;

describe("DexService", () => {
  let service: DexService;

  beforeEach(() => {
    service = new DexService();
    jest.clearAllMocks();
  });

  // ---------- OfferCreate ----------

  describe("getOfferCreateUnsignedTx", () => {
    const baseArgs = {
      address: "rMaker",
      sellAmount: {
        currency: "USD",
        issuer: "rIssuer",
        value: "100",
      } as Amount,
      buyAmount: { currency: "BTC", issuer: "rIssuer", value: "0.5" } as Amount,
      fee: "12",
      sequence: 100,
      lastLedgerSequence: 120,
      expiration: 500,
      flags: { tfFillOrKillOffer: true },
      memos: [{ Memo: { MemoType: "foo", MemoData: "bar" } }] as Memo[],
    };

    it("constructs OfferCreate tx with all valid inputs", () => {
      mockValidateAmount.mockReturnValue(undefined);
      mockDeriveOfferCreateFlags.mockReturnValue(0x80000000);
      mockValidateMemos.mockReturnValue(baseArgs.memos);

      const tx = service.getOfferCreateUnsignedTx(
        baseArgs.address,
        baseArgs.sellAmount,
        baseArgs.buyAmount,
        baseArgs.fee,
        baseArgs.sequence,
        baseArgs.lastLedgerSequence,
        baseArgs.expiration,
        baseArgs.flags,
        baseArgs.memos
      );

      expect(tx.TransactionType).toBe("OfferCreate");
      expect(tx.Expiration).toBe(baseArgs.expiration);
      expect(tx.Flags).toBe(0x80000000);
      expect(tx.Memos).toEqual(baseArgs.memos);
    });

    it("omits optional fields when not provided", () => {
      mockValidateAmount.mockReturnValue(undefined);
      mockDeriveOfferCreateFlags.mockReturnValue(undefined);

      const tx = service.getOfferCreateUnsignedTx(
        baseArgs.address,
        baseArgs.sellAmount,
        baseArgs.buyAmount,
        baseArgs.fee,
        baseArgs.sequence,
        baseArgs.lastLedgerSequence
      );

      expect(tx.Expiration).toBeUndefined();
      expect(tx.Flags).toBeUndefined();
      expect(tx.Memos).toBeUndefined();
    });

    it("throws ValidationError for invalid sellAmount or buyAmount", () => {
      mockValidateAmount.mockImplementationOnce(() => {
        throw new ValidationError("BadAmount", "sell invalid");
      });
      expect(() =>
        service.getOfferCreateUnsignedTx(
          baseArgs.address,
          baseArgs.sellAmount,
          baseArgs.buyAmount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence
        )
      ).toThrow(ValidationError);

      mockValidateAmount
        .mockReturnValueOnce(undefined)
        .mockImplementationOnce(() => {
          throw new ValidationError("BadAmount", "buy invalid");
        });
      expect(() =>
        service.getOfferCreateUnsignedTx(
          baseArgs.address,
          baseArgs.sellAmount,
          baseArgs.buyAmount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence
        )
      ).toThrow(ValidationError);
    });

    it("throws ValidationError for negative or fractional expiration", () => {
      mockValidateAmount.mockReturnValue(undefined);
      expect(() =>
        service.getOfferCreateUnsignedTx(
          baseArgs.address,
          baseArgs.sellAmount,
          baseArgs.buyAmount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence,
          -1
        )
      ).toThrow(ValidationError);

      expect(() =>
        service.getOfferCreateUnsignedTx(
          baseArgs.address,
          baseArgs.sellAmount,
          baseArgs.buyAmount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence,
          1.5 as any
        )
      ).toThrow(ValidationError);
    });

    it("throws ValidationError when deriveOfferCreateFlags errors", () => {
      mockValidateAmount.mockReturnValue(undefined);
      mockDeriveOfferCreateFlags.mockImplementation(() => {
        throw new Error("flag issue");
      });
      expect(() =>
        service.getOfferCreateUnsignedTx(
          baseArgs.address,
          baseArgs.sellAmount,
          baseArgs.buyAmount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence,
          baseArgs.expiration,
          baseArgs.flags
        )
      ).toThrow(ValidationError);
    });

    it("wraps unexpected errors in OfferCreateError", () => {
      // simulate unexpected error
      mockValidateAmount.mockImplementation(() => {
        throw new Error("oops");
      });
      expect(() =>
        service.getOfferCreateUnsignedTx(
          baseArgs.address,
          baseArgs.sellAmount,
          baseArgs.buyAmount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence
        )
      ).toThrow(ValidationError);
    });
  });

  // ---------- CrossCurrencyPayment ----------

  describe("getCrossCurrencyPaymentUnsignedTx", () => {
    const baseArgs = {
      address: "rSender",
      destination: "rDest",
      amount: { currency: "USD", issuer: "rIssuer", value: "100" } as Amount,
      fee: "12",
      sequence: 1,
      lastLedgerSequence: 10,
      sendMax: { currency: "USD", issuer: "rIssuer", value: "150" } as Amount,
      paths: [
        [{ account: "rSomeAccount", currency: "USD", issuer: "rIssuer" }],
      ] as Path[],
      flags: { tfPartialPayment: true } as IPaymentFlags,
      memos: [{ Memo: { MemoType: "note", MemoData: "test" } }] as Memo[],
      destinationTag: 123,
      invoiceId: "INV123",
    };

    it("constructs Payment tx with valid inputs", () => {
      mockValidateAmount.mockReturnValue(undefined);
      mockDerivePaymentFlags.mockReturnValue(0x00020000);
      mockValidateMemos.mockReturnValue(baseArgs.memos);

      const tx = service.getCrossCurrencyPaymentUnsignedTx(
        baseArgs.address,
        baseArgs.destination,
        baseArgs.amount,
        baseArgs.fee,
        baseArgs.sequence,
        baseArgs.lastLedgerSequence,
        baseArgs.sendMax,
        baseArgs.paths,
        baseArgs.flags,
        baseArgs.memos,
        baseArgs.destinationTag,
        baseArgs.invoiceId
      );

      expect(tx.TransactionType).toBe("Payment");
      expect(tx.SendMax).toEqual(baseArgs.sendMax);
      expect(tx.Paths).toEqual(baseArgs.paths);
      expect(tx.Flags).toBe(0x00020000);
      expect(tx.Memos).toEqual(baseArgs.memos);
      expect(tx.DestinationTag).toBe(baseArgs.destinationTag);
      expect(tx.InvoiceID).toBe(baseArgs.invoiceId);
    });

    it("omits optional fields when not provided", () => {
      mockValidateAmount.mockReturnValue(undefined);
      mockDerivePaymentFlags.mockReturnValue(undefined);

      const tx = service.getCrossCurrencyPaymentUnsignedTx(
        baseArgs.address,
        baseArgs.destination,
        baseArgs.amount,
        baseArgs.fee,
        baseArgs.sequence,
        baseArgs.lastLedgerSequence
      );

      expect(tx.SendMax).toBeUndefined();
      expect(tx.Paths).toBeUndefined();
      expect(tx.Flags).toBeUndefined();
      expect(tx.Memos).toBeUndefined();
      expect(tx.DestinationTag).toBeUndefined();
      expect(tx.InvoiceID).toBeUndefined();
    });

    it("throws ValidationError for invalid destination", () => {
      expect(() =>
        service.getCrossCurrencyPaymentUnsignedTx(
          baseArgs.address,
          "" as any,
          baseArgs.amount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence
        )
      ).toThrow(ValidationError);
    });

    it("throws ValidationError for invalid amount or sendMax", () => {
      mockValidateAmount.mockImplementationOnce(() => {
        throw new ValidationError("BadAmt", "amount invalid");
      });
      expect(() =>
        service.getCrossCurrencyPaymentUnsignedTx(
          baseArgs.address,
          baseArgs.destination,
          baseArgs.amount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence
        )
      ).toThrow(ValidationError);

      mockValidateAmount.mockReturnValue(undefined);
      mockValidateAmount.mockImplementationOnce(() => {
        throw new ValidationError("BadAmt", "sendMax invalid");
      });
      expect(() =>
        service.getCrossCurrencyPaymentUnsignedTx(
          baseArgs.address,
          baseArgs.destination,
          baseArgs.amount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence,
          baseArgs.sendMax
        )
      ).toThrow(ValidationError);
    });

    it("throws ValidationError for invalid destinationTag or invoiceId", () => {
      expect(() =>
        service.getCrossCurrencyPaymentUnsignedTx(
          baseArgs.address,
          baseArgs.destination,
          baseArgs.amount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence,
          undefined,
          undefined,
          undefined,
          undefined,
          -5
        )
      ).toThrow(ValidationError);

      expect(() =>
        service.getCrossCurrencyPaymentUnsignedTx(
          baseArgs.address,
          baseArgs.destination,
          baseArgs.amount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          ""
        )
      ).toThrow(ValidationError);
    });

    it("throws ValidationError when derivePaymentFlags errors", () => {
      mockValidateAmount.mockReturnValue(undefined);
      mockDerivePaymentFlags.mockImplementation(() => {
        throw new Error("flag error");
      });
      expect(() =>
        service.getCrossCurrencyPaymentUnsignedTx(
          baseArgs.address,
          baseArgs.destination,
          baseArgs.amount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence,
          undefined,
          undefined,
          baseArgs.flags
        )
      ).toThrow(ValidationError);
    });

    it("wraps unexpected errors in PaymentError", () => {
      mockValidateAmount.mockImplementation(() => {
        throw new Error("oops");
      });
      expect(() =>
        service.getCrossCurrencyPaymentUnsignedTx(
          baseArgs.address,
          baseArgs.destination,
          baseArgs.amount,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence
        )
      ).toThrow(ValidationError);
    });
  });

  // ---------- OfferCancel ----------

  describe("getOfferCancelUnsignedTx", () => {
    const baseArgs = {
      address: "rMaker",
      offerSequence: 42,
      fee: "10",
      sequence: 5,
      lastLedgerSequence: 15,
      memos: [{ Memo: { MemoType: "foo", MemoData: "bar" } }] as Memo[],
    };

    it("constructs OfferCancel tx with valid inputs", () => {
      const tx = service.getOfferCancelUnsignedTx(
        baseArgs.address,
        baseArgs.offerSequence,
        baseArgs.fee,
        baseArgs.sequence,
        baseArgs.lastLedgerSequence
      );
      expect(tx.TransactionType).toBe("OfferCancel");
      expect(tx.OfferSequence).toBe(baseArgs.offerSequence);
    });

    it("includes Memos when provided", () => {
      mockValidateMemos.mockReturnValue(baseArgs.memos);
      const tx = service.getOfferCancelUnsignedTx(
        baseArgs.address,
        baseArgs.offerSequence,
        baseArgs.fee,
        baseArgs.sequence,
        baseArgs.lastLedgerSequence,
        baseArgs.memos
      );
      expect(tx.Memos).toEqual(baseArgs.memos);
    });

    it("throws ValidationError for non-positive or non-integer offerSequence", () => {
      expect(() =>
        service.getOfferCancelUnsignedTx(
          baseArgs.address,
          0,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence
        )
      ).toThrow(ValidationError);
      expect(() =>
        service.getOfferCancelUnsignedTx(
          baseArgs.address,
          1.5 as any,
          baseArgs.fee,
          baseArgs.sequence,
          baseArgs.lastLedgerSequence
        )
      ).toThrow(ValidationError);
    });
  });
});
