import { ITrustSetFlags } from "../config/types";

/**
 * XRP Limits in drops
 */
export const XRP_LIMITS = {
  /** Minimum non-zero amount of XRP allowed */
  MIN_XRP: "1", // 0.000001 XRP
  /** Maximum amount of XRP that can exist (100 billion) */
  MAX_XRP: "100000000000000000", // 100 billion XRP in drops
};

// TTL used to calculate the lastLedgerSequesnce for transactions.
export const TTL_CONST = 20;

// limitation for the domain length in bytes
export const MAX_DOMAIN_BYTES = 256;

/** The canonical “black‐hole” XRPL address for burning issued tokens. */
export const XRPL_BURN_ADDRESS = "rrrrrrrrrrrrrrrrrrrrBZbvji";

/** Map ITrustSetFlags keys to their numeric bit values */
export const TrustSetFlagValues: Record<keyof ITrustSetFlags, number> = {
  tfSetfAuth: 0x00010000,
  tfSetNoRipple: 0x00020000,
  tfClearNoRipple: 0x00040000,
  tfSetFreeze: 0x00100000,
  tfClearFreeze: 0x00200000,
};

export const HEX_REGEX = /^[0-9A-Fa-f]{2,512}$/;
