import { Memo } from "xrpl";
import { OracleSetOpts, OracleDeleteOpts, PriceData } from "../config/types";
import { validateMemos } from "../utils/utils";
import { ValidationError } from "../errors/errors";

/**
 * Oracle transaction types extending the base Transaction interface
 */
export interface OracleSetTransaction {
  TransactionType: "OracleSet";
  Account: string;
  OracleDocumentID: number;
  LastUpdateTime: number;
  PriceDataSeries: Array<{ PriceData: PriceData }>;
  Fee: string;
  Sequence: number;
  LastLedgerSequence: number;
  Provider?: string;
  URI?: string;
  AssetClass?: string;
  Memos?: Memo[];
}

export interface OracleDeleteTransaction {
  TransactionType: "OracleDelete";
  Account: string;
  OracleDocumentID: number;
  Fee: string;
  Sequence: number;
  LastLedgerSequence: number;
  Memos?: Memo[];
}

export class OracleService {
  /**
   * OracleSet transaction creation method.
   * @param address - Account address
   * @param fee - Fee in drops, automatically calculated by the SDK
   * @param sequence - Sequence number, automatically fetched by the SDK
   * @param lastLedgerSequence - TTL: last ledger sequence, automatically calculated by the SDK
   * @param opts - OracleSetOpts object containing Oracle configuration
   * @param memos - Optional memos for the transaction
   * @returns OracleSet transaction object
   * @throws ValidationError if the parameters are invalid
   */
  public createOracleSetTx = (
    address: string,
    fee: string,
    sequence: number,
    lastLedgerSequence: number,
    opts: OracleSetOpts,
    memos?: Memo[]
  ): OracleSetTransaction => {
    try {
      // Validate OracleDocumentID
      if (!Number.isInteger(opts.OracleDocumentID) || opts.OracleDocumentID <= 0) {
        throw new ValidationError(
          "InvalidOracleDocumentID",
          "OracleDocumentID must be a positive integer"
        );
      }

      // Validate LastUpdateTime
      if (!Number.isInteger(opts.LastUpdateTime) || opts.LastUpdateTime <= 0) {
        throw new ValidationError(
          "InvalidLastUpdateTime",
          "LastUpdateTime must be a positive integer (Unix timestamp)"
        );
      }

      // Validate PriceDataSeries
      if (!Array.isArray(opts.PriceDataSeries) || opts.PriceDataSeries.length === 0) {
        throw new ValidationError(
          "InvalidPriceDataSeries",
          "PriceDataSeries must be a non-empty array"
        );
      }

      // Validate each PriceData entry
      opts.PriceDataSeries.forEach((item, index) => {
        if (!item.PriceData) {
          throw new ValidationError(
            "InvalidPriceData",
            `PriceDataSeries[${index}] must have a PriceData object`
          );
        }

        const priceData = item.PriceData;
        
        // Validate BaseAsset
        if (!priceData.BaseAsset || typeof priceData.BaseAsset !== "string") {
          throw new ValidationError(
            "InvalidBaseAsset",
            `PriceDataSeries[${index}].BaseAsset must be a non-empty string`
          );
        }

        // Validate QuoteAsset
        if (!priceData.QuoteAsset || typeof priceData.QuoteAsset !== "string") {
          throw new ValidationError(
            "InvalidQuoteAsset",
            `PriceDataSeries[${index}].QuoteAsset must be a non-empty string`
          );
        }

        // Validate AssetPrice if provided
        if (priceData.AssetPrice !== undefined) {
          if (typeof priceData.AssetPrice !== "string" || !/^[0-9A-Fa-f]+$/.test(priceData.AssetPrice)) {
            throw new ValidationError(
              "InvalidAssetPrice",
              `PriceDataSeries[${index}].AssetPrice must be a hexadecimal string`
            );
          }
        }

        // Validate Scale if provided
        if (priceData.Scale !== undefined) {
          if (!Number.isInteger(priceData.Scale) || priceData.Scale < 0 || priceData.Scale > 15) {
            throw new ValidationError(
              "InvalidScale",
              `PriceDataSeries[${index}].Scale must be an integer between 0 and 15`
            );
          }
        }
      });

      // Validate Provider if provided
      if (opts.Provider !== undefined) {
        if (typeof opts.Provider !== "string" || !/^[A-Fa-f0-9]+$/.test(opts.Provider)) {
          throw new ValidationError(
            "InvalidProvider",
            "Provider must be a hex-encoded string"
          );
        }
      }

      // Validate URI if provided
      if (opts.URI !== undefined) {
        if (typeof opts.URI !== "string" || !/^[A-Fa-f0-9]+$/.test(opts.URI)) {
          throw new ValidationError(
            "InvalidURI",
            "URI must be a hex-encoded string"
          );
        }
      }

      // Validate AssetClass if provided
      if (opts.AssetClass !== undefined) {
        if (typeof opts.AssetClass !== "string" || !/^[A-Fa-f0-9]+$/.test(opts.AssetClass)) {
          throw new ValidationError(
            "InvalidAssetClass",
            "AssetClass must be a hex-encoded string"
          );
        }
      }

      // Validate and process memos if provided
      const validatedMemos = memos ? validateMemos(memos) : undefined;

      // Build the transaction
      const tx: OracleSetTransaction = {
        TransactionType: "OracleSet",
        Account: address,
        OracleDocumentID: opts.OracleDocumentID,
        LastUpdateTime: opts.LastUpdateTime,
        PriceDataSeries: opts.PriceDataSeries,
        Fee: fee,
        Sequence: sequence,
        LastLedgerSequence: lastLedgerSequence,
        ...(opts.Provider && { Provider: opts.Provider }),
        ...(opts.URI && { URI: opts.URI }),
        ...(opts.AssetClass && { AssetClass: opts.AssetClass }),
        ...(validatedMemos && { Memos: validatedMemos }),
      };

      return tx;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Error creating OracleSet transaction: ${error.message}`);
    }
  };

  /**
   * OracleDelete transaction creation method.
   * @param address - Account address
   * @param fee - Fee in drops, automatically calculated by the SDK
   * @param sequence - Sequence number, automatically fetched by the SDK
   * @param lastLedgerSequence - TTL: last ledger sequence, automatically calculated by the SDK
   * @param opts - OracleDeleteOpts object containing Oracle Document ID
   * @param memos - Optional memos for the transaction
   * @returns OracleDelete transaction object
   * @throws ValidationError if the parameters are invalid
   */
  public createOracleDeleteTx = (
    address: string,
    fee: string,
    sequence: number,
    lastLedgerSequence: number,
    opts: OracleDeleteOpts,
    memos?: Memo[]
  ): OracleDeleteTransaction => {
    try {
      // Validate OracleDocumentID
      if (!Number.isInteger(opts.OracleDocumentID) || opts.OracleDocumentID <= 0) {
        throw new ValidationError(
          "InvalidOracleDocumentID",
          "OracleDocumentID must be a positive integer"
        );
      }

      // Validate and process memos if provided
      const validatedMemos = memos ? validateMemos(memos) : undefined;

      // Build the transaction
      const tx: OracleDeleteTransaction = {
        TransactionType: "OracleDelete",
        Account: address,
        OracleDocumentID: opts.OracleDocumentID,
        Fee: fee,
        Sequence: sequence,
        LastLedgerSequence: lastLedgerSequence,
        ...(validatedMemos && { Memos: validatedMemos }),
      };

      return tx;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Error creating OracleDelete transaction: ${error.message}`);
    }
  };
}
