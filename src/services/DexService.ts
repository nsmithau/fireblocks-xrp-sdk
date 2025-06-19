import { OfferCreate, Amount, Memo, OfferCancel, Payment, Path } from "xrpl";
import { IOfferCreateFlags, IPaymentFlags } from "../config/types";
import {
  deriveOfferCreateFlags,
  derivePaymentFlags,
  validateAmount,
  validateMemos,
} from "../utils/utils";
import { ValidationError } from "../errors/errors";

/**
 * Service class for interacting with the XRPL Decentralized Exchange (DEX)
 */
export class DexService {
  /**
   * Builds an unsigned OfferCreate transaction for the XRPL DEX
   *
   * @param address - The XRPL address of the account making the offer (pre-validated)
   * @param sellAmount - The amount to sell (TakerGets)
   * @param buyAmount - The amount to buy (TakerPays)
   * @param fee - The transaction fee in drops (pre-validated)
   * @param sequence - The account sequence number (pre-validated)
   * @param lastLedgerSequence - The last ledger sequence where this transaction is valid
   * @param expiration - Optional expiration time in seconds since the Ripple Epoch
   * @param flags - Optional flags for the OfferCreate transaction
   * @param memos - Optional memos to attach to the transaction
   * @returns An unsigned OfferCreate transaction
   * @throws {ValidationError} If user-provided parameters are invalid
   */
  public getOfferCreateUnsignedTx = (
    address: string,
    sellAmount: Amount,
    buyAmount: Amount,
    fee: string,
    sequence: number,
    lastLedgerSequence: number,
    expiration?: number,
    flags?: IOfferCreateFlags,
    memos?: Memo[]
  ): OfferCreate => {
    try {
      // Validate user-provided amounts
      validateAmount("sellAmount", sellAmount);
      validateAmount("buyAmount", buyAmount);

      // Validate expiration if provided
      if (
        expiration !== undefined &&
        (!Number.isInteger(expiration) || expiration < 0)
      ) {
        throw new ValidationError(
          "InvalidExpiration",
          "Expiration must be a non-negative integer"
        );
      }

      // Validate memos if provided
      const validatedMemos = memos ? validateMemos(memos) : undefined;

      // Derive flags bitmask
      let combinedFlags: number | undefined;
      try {
        combinedFlags = flags ? deriveOfferCreateFlags(flags) : undefined;
      } catch (error: any) {
        throw new ValidationError(
          "InvalidFlags",
          `OfferCreate flags error: ${error.message}`
        );
      }

      // Build and return transaction
      const tx: OfferCreate = {
        TransactionType: "OfferCreate",
        Account: address,
        TakerGets: sellAmount,
        TakerPays: buyAmount,
        Fee: fee,
        Sequence: sequence,
        LastLedgerSequence: lastLedgerSequence,
        ...(validatedMemos && validatedMemos.length > 0
          ? { Memos: validatedMemos }
          : {}),
        ...(expiration !== undefined && { Expiration: expiration }),
        ...(combinedFlags !== undefined && { Flags: combinedFlags }),
      };

      return tx;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        "OfferCreateError",
        `Error creating unsigned OfferCreate tx: ${error.message || error}`
      );
    }
  };

  /**
   * Builds an unsigned Payment transaction for cross-currency payments on the XRPL
   *
   * @param address - The XRPL address of the sender (pre-validated)
   * @param destination - The XRPL address of the recipient
   * @param amount - The amount to deliver to the recipient
   * @param fee - The transaction fee in drops (pre-validated)
   * @param sequence - The account sequence number (pre-validated)
   * @param lastLedgerSequence - The last ledger sequence where this transaction is valid
   * @param sendMax - The maximum amount to send (for partial payments)
   * @param paths - Optional payment paths to use
   * @param flags - Optional flags for the Payment transaction
   * @param memos - Optional memos to attach to the transaction
   * @param destinationTag - Optional destination tag for the recipient
   * @param invoiceId - Optional invoice ID
   * @returns An unsigned Payment transaction
   * @throws {ValidationError} If user-provided parameters are invalid
   */
  public getCrossCurrencyPaymentUnsignedTx = (
    address: string,
    destination: string,
    amount: Amount,
    fee: string,
    sequence: number,
    lastLedgerSequence: number,
    sendMax?: Amount,
    paths?: Path[],
    flags?: IPaymentFlags,
    memos?: Memo[],
    destinationTag?: number,
    invoiceId?: string
  ): Payment => {
    try {
      // Validate destination address
      if (!destination || typeof destination !== "string") {
        throw new ValidationError(
          "InvalidDestination",
          "Destination address must be a string"
        );
      }

      // Validate user-provided amounts
      validateAmount("amount", amount);
      if (sendMax) {
        validateAmount("sendMax", sendMax);
      }

      // Validate destinationTag if provided
      if (
        destinationTag !== undefined &&
        (!Number.isInteger(destinationTag) || destinationTag < 0)
      ) {
        throw new ValidationError(
          "InvalidDestinationTag",
          "DestinationTag must be a non-negative integer"
        );
      }

      // Validate invoiceId if provided
      if (
        invoiceId !== undefined &&
        (typeof invoiceId !== "string" || invoiceId.length === 0)
      ) {
        throw new ValidationError(
          "InvalidInvoiceId",
          "InvoiceId must be a non-empty string"
        );
      }

      // Validate memos if provided
      const validatedMemos = memos ? validateMemos(memos) : undefined;

      // Derive flags bitmask
      let combinedFlags: number | undefined;
      try {
        combinedFlags = flags ? derivePaymentFlags(flags) : undefined;
      } catch (error: any) {
        throw new ValidationError(
          "InvalidFlags",
          `Payment flags error: ${error.message}`
        );
      }

      // Build and return transaction
      const tx: Payment = {
        TransactionType: "Payment",
        Account: address,
        Destination: destination,
        Amount: amount,
        Fee: fee,
        Sequence: sequence,
        LastLedgerSequence: lastLedgerSequence,
        ...(sendMax !== undefined && { SendMax: sendMax }),
        ...(paths?.length ? { Paths: paths } : {}),
        ...(combinedFlags !== undefined && { Flags: combinedFlags }),
        ...(validatedMemos && validatedMemos.length > 0
          ? { Memos: validatedMemos }
          : {}),
        ...(destinationTag !== undefined && { DestinationTag: destinationTag }),
        ...(invoiceId !== undefined && { InvoiceID: invoiceId }),
      };

      return tx;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        "PaymentError",
        `Error creating unsigned Payment tx: ${error.message || error}`
      );
    }
  };

  /**
   * Builds an unsigned OfferCancel transaction for cancelling existing offers on the XRPL DEX
   *
   * @param address - The XRPL address of the account cancelling the offer (pre-validated)
   * @param offerSequence - The sequence number of the offer to cancel
   * @param fee - The transaction fee in drops (pre-validated)
   * @param sequence - The account sequence number (pre-validated)
   * @param lastLedgerSequence - The last ledger sequence where this transaction is valid
   * @param memos - Optional memos to attach to the transaction
   * @returns An unsigned OfferCancel transaction
   * @throws {ValidationError} If user-provided parameters are invalid
   */
  public getOfferCancelUnsignedTx = (
    address: string,
    offerSequence: number,
    fee: string,
    sequence: number,
    lastLedgerSequence: number,
    memos?: Memo[]
  ): OfferCancel => {
    try {
      // Validate offerSequence
      if (!Number.isInteger(offerSequence) || offerSequence <= 0) {
        throw new ValidationError(
          "InvalidOfferSequence",
          "OfferSequence must be a positive integer"
        );
      }

      // Validate memos if provided
      const validatedMemos = memos ? validateMemos(memos) : undefined;

      // Build and return transaction
      const tx: OfferCancel = {
        TransactionType: "OfferCancel",
        Account: address,
        OfferSequence: offerSequence,
        Fee: fee,
        Sequence: sequence,
        LastLedgerSequence: lastLedgerSequence,
        ...(validatedMemos && validatedMemos.length > 0
          ? { Memos: validatedMemos }
          : {}),
      };

      return tx;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        "OfferCancelError",
        `Error creating unsigned OfferCancel tx: ${error.message || error}`
      );
    }
  };
}
