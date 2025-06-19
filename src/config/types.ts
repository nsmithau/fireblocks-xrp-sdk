import { DestinationTransferPeerPath } from "@fireblocks/ts-sdk";
import { Amount, IssuedCurrencyAmount, Memo, Path } from "xrpl";

/** Signed transaction placeholder (blob + hash) */
export interface SignedTransaction {
  tx_blob: string;
  hash: string;
}

/**
 * “Flags” for OfferCreate transactions.
 */
export interface IOfferCreateFlags {
  /** tfPassive */
  tfPassiveOffer?: boolean;
  /** tfImmediateOrCancel */
  tfImmediateOrCancelOffer?: boolean;
  /** tfFillOrKill */
  tfFillOrKillOffer?: boolean;
  /** tfSell */
  tfSellOffer?: boolean;
}

/**
 * Payment flags.
 */
export interface IPaymentFlags {
  /** tfNoRippleDirect */
  tfNoRippleDirect?: boolean;
  /** tfPartialPayment */
  tfPartialPayment?: boolean;
  /** tfLimitQuality */
  tfLimitQuality?: boolean;
}

/**
 * Flags for a TrustSet (including freeze/unfreeze).
 */
export interface ITrustSetFlags {
  /** Authorize the trust line (issuer only) */
  tfSetfAuth?: boolean;
  /** Disable rippling for this line */
  tfSetNoRipple?: boolean;
  /** Enable rippling (clear NoRipple) */
  tfClearNoRipple?: boolean;
  /** Freeze this trust line */
  tfSetFreeze?: boolean;
  /** Unfreeze (clear freeze) */
  tfClearFreeze?: boolean;
}

/**
 * Flags for AccountSet → “ASF”
 */
export interface AsfFlags {
  asfRequireAuth?: boolean;
  asfDefaultRipple?: boolean;
  asfAllowTrustLineClawback?: boolean;
  asfDisableMaster?: boolean;
  asfRequireDestTag?: boolean;
  asfDisallowXRP?: boolean;
}

/**
 * Flags for AccountSet → “TF” (Bitmask).
 */
export interface TfFlags {
  tfRequireDestTag?: boolean;
  tfOptionalDestTag?: boolean;
  tfRequireAuth?: boolean;
  tfOptionalAuth?: boolean;
  tfDisallowXRP?: boolean;
  tfAllowXRP?: boolean;
}

/**
 * Full AccountSet config (one or zero AsfFlags, any TfFlags, plus other fields).
 */
export interface AccountSetConfig {
  /** At most one ASF boolean per transaction */
  setFlag?: AsfFlags;
  /** At most one ASF boolean per transaction to clear */
  clearFlag?: AsfFlags;

  /** Zero or more TF flags (they get OR’d into Flags) */
  tfFlags?: TfFlags;

  // Other optional fields for AccountSet:
  domain?: string; // e.g. “example.com” (hex-encoded before sending)
  transferRate?: number; // 1e9..2e9
  tickSize?: number; // 3-15
  emailHash?: string; // 32-hex chars
  messageKey?: string; // 66-hex, “02|03|ED…” prefixed
}

export interface AccountSetOpts {
  /**
   * Full AccountSet configuration. Any combination of ASF, TF flags, and
   * optional fields (domain, transferRate, tickSize, emailHash, messageKey).
   */
  configs: AccountSetConfig;

  /** Optional memos to attach to the AccountSet transaction. */
  memos?: Memo[];
}

/**
 * Options for setting or modifying a trust line on the XRPL.
 *
 * - `limitAmount`: the IssuedCurrencyAmount defining the counterparty and currency
 *   (e.g. { currency: "USD", issuer: "rCounterpartyAddress...", value: "100" }).
 *   The SDK’s own `classicAddress` is the Account executing the TrustSet.
 * - `flags`: optional ITrustSetFlags (e.g. tfSetNoRipple, tfClearFreeze, tfSetfAuth, etc.).
 * - `qualityIn` / `qualityOut`: optional integer >0 (1..2^32-1).
 * - `memos`, `destinationTag`, `invoiceId`: optional for on‐chain tagging.
 */
export interface TrustSetOpts {
  /** How much of the IOU you’re willing to trust (or modify). */
  limitAmount: IssuedCurrencyAmount;

  /** Optional flags: e.g. tfSetNoRipple, tfSetFreeze, tfSetfAuth, etc. */
  flags?: ITrustSetFlags;

  /** Optional integer 1..2^32-1. */
  qualityIn?: number;

  /** Optional integer 1..2^32-1. */
  qualityOut?: number;

  /** Optional memos to attach. */
  memos?: Memo[];
}

/**
 * Options for issuing a new fungible token:
 *  • currency is a 3 charachters string or a 160-bit hex.
 *  • initialSupply is a decimal string > 0
 *  • recipients (optional) is a list of address→amount mappings
 *  • issuerConfig is an AccountSetConfig for the issuer
 *  • memos (optional) to attach to each issuance tx
 */
export interface IssueTokenOptions {
  currency: string;
  initialSupply: string;
  issuerConfig?: AccountSetConfig;
  memos?: Memo[];
}

/**
 * Options specifically for a distribution account’s AccountSet.
 */
export interface DistributionAccountSetOpts {
  issuerConfig?: AccountSetConfig;
  memos?: Memo[];
}

/**
 * Base “payment-like” options shared by many flows:
 *  • memos, invoiceId, destinationTag often re-appear.
 */
interface BasePaymentOpts {
  memos?: Memo[];
  invoiceId?: string;
  destinationTag?: number;
}

/**
 * TokenTransfer
 *  • destination (string)
 *  • amount (drops string or IssuedCurrencyAmount)
 *  • optional flags, memos, tags, invoice, sendMax, deliverMin
 */
export interface TokenTransferOpts extends BasePaymentOpts {
  destination: string;
  amount: Amount;
  flags?: IPaymentFlags;
  sendMax?: Amount;
  deliverMin?: Amount;
}

/**
 * opts interface for XrpTransfer
 * • destination is a DestinationTransferPeerPath (e.g. OneTimeAddress, PeerPath, etc.)
 * • amount is a string (e.g. "1" for 1 XRP)
 * • optional note (string) to attach to the Fireblocks transaction
 */
export interface XrpTransferOpts {
  destination: DestinationTransferPeerPath;
  amount: string;
  note?: string;
}
/**
 * Cross-currency (DEX) payment extends a regular TokenTransfer,
 * but requires sendMax and may include explicit paths.
 */
export interface CrossCurrencyPaymentOpts extends TokenTransferOpts {
  sendMax: Amount;
  paths?: Path[];
}

/**
 * OfferCreate (DEX):
 *  • sellAmount, buyAmount are each “Amount” (drops or IOU).
 *  • optional expiration, flags, memos.
 */
export interface OfferCreateOpts {
  sellAmount: Amount;
  buyAmount: Amount;
  expiration?: number;
  flags?: IOfferCreateFlags;
  memos?: Memo[];
}

/**
 * OfferCancel (DEX):
 *  • Just the sequence number of the open offer + optional memos.
 */
export interface OfferCancelOpts {
  offerSequence: number;
  memos?: Memo[];
}

/**
 * Convenience shape for network parameters (fee, sequence, TTL).
 */
export interface NetworkParams {
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
}

/**
 * BurnToken: send IOU to the canonical burn address.
 *  • amount must be an IssuedCurrencyAmount
 */
export interface BurnTokenOpts extends BasePaymentOpts {
  amount: IssuedCurrencyAmount;
  flags?: IPaymentFlags;
}

/**
 * Clawback: issuer revokes a holder’s IOUs.
 *  • holder (string), currency (string), value (string) (Currency and Value are used to build the IssuedCurrencyAmount object with sdk.address as issuer)
 *  • optional memos, invoiceId, destinationTag
 */
export interface ClawbackOpts extends BasePaymentOpts {
  holder: string;
  currency: string;
  value: string;
}

/**
 * FreezeToken: freeze or unfreeze a holder’s trust line.
 *  • holder (string), currency (string), freeze (boolean)
 *  • optional memos, invoiceId, destinationTag
 */
export interface FreezeTokenOpts extends BasePaymentOpts {
  holder: string;
  currency: string;
  freeze: boolean;
}
