import { BasePath, TransactionResponse } from "@fireblocks/ts-sdk";
import { TxResponse } from "xrpl";
import { SdkManager } from "../pool/SdkManager";
import {
  ApiServiceConfig,
  SdkManagerMetrics,
  TransactionType,
} from "../pool/types";
import {
  OfferCreateOpts,
  OfferCancelOpts,
  CrossCurrencyPaymentOpts,
  AccountSetOpts,
  TrustSetOpts,
  TokenTransferOpts,
  BurnTokenOpts,
  FreezeTokenOpts,
  ClawbackOpts,
  XrpTransferOpts,
} from "../config/types";
import { Logger } from "../utils/logger";
import { ValidationError } from "../errors/errors";
import { FireblocksXrpSdk } from "../FireblocksXrpSdk";

const logger = new Logger("api-service");

export class FbksXrpApiService {
  private sdkManager: SdkManager;

  constructor(config: ApiServiceConfig) {
    if (!config || typeof config !== "object") {
      throw new ValidationError("InvalidConfig", "Config object is required.");
    }
    if (
      !config.apiKey ||
      typeof config.apiKey !== "string" ||
      !config.apiKey.trim()
    ) {
      throw new ValidationError(
        "InvalidConfig",
        "apiKey must be a non-empty string."
      );
    }
    if (
      !config.apiSecret ||
      typeof config.apiSecret !== "string" ||
      !config.apiSecret.trim()
    ) {
      throw new ValidationError(
        "InvalidConfig",
        "apiSecret must be a non-empty string."
      );
    }
    if (
      !config.assetId ||
      typeof config.assetId !== "string" ||
      !config.assetId.trim()
    ) {
      throw new ValidationError(
        "InvalidConfig",
        "assetId must be a non-empty string."
      );
    }
    if (
      config.basePath &&
      !Object.values(BasePath).includes(config.basePath as BasePath)
    ) {
      throw new ValidationError(
        "InvalidConfig",
        `basePath must be one of: ${Object.values(BasePath).join(", ")}`
      );
    }
    if (config.poolConfig && typeof config.poolConfig !== "object") {
      throw new ValidationError(
        "InvalidConfig",
        "poolConfig must be an object if provided."
      );
    }

    const baseConfig = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      assetId: config.assetId,
      basePath: (config.basePath as BasePath) || BasePath.US,
      vaultAccountId: "", // Will be overridden per instantiation
    };

    this.sdkManager = new SdkManager(baseConfig, config.poolConfig);
  }

  /**
   * Execute a transaction using the appropriate SDK method
   */
  public async executeTransaction(
    vaultAccountId: string,
    transactionType: TransactionType,
    params:
      | OfferCreateOpts
      | OfferCancelOpts
      | OfferCancelOpts
      | CrossCurrencyPaymentOpts
      | AccountSetOpts
      | TrustSetOpts
      | TokenTransferOpts
      | BurnTokenOpts
      | FreezeTokenOpts
      | ClawbackOpts
      | XrpTransferOpts
  ): Promise<TxResponse | TransactionResponse> {
    let sdk: FireblocksXrpSdk;
    try {
      // Get SDK instance from the pool
      sdk = await this.sdkManager.getSdk(vaultAccountId);

      // Execute the appropriate transaction based on type
      let result: TxResponse | TransactionResponse;
      switch (transactionType) {
        case TransactionType.OFFER_CREATE:
          result = await sdk.offerCreate(params as OfferCreateOpts);
          break;
        case TransactionType.OFFER_CANCEL:
          result = await sdk.offerCancel(params as OfferCancelOpts);
          break;
        case TransactionType.CROSS_CURRENCY_PAYMENT:
          result = await sdk.crossCurrencyPayment(
            params as CrossCurrencyPaymentOpts
          );
          break;
        case TransactionType.ACCOUNT_SET:
          result = await sdk.accountSet(params as AccountSetOpts);
          break;
        case TransactionType.TRUST_SET:
          result = await sdk.trustSet(params as TrustSetOpts);
          break;
        case TransactionType.TOKEN_TRANSFER:
          result = await sdk.tokenTransfer(params as TokenTransferOpts);
          break;
        case TransactionType.BURN_TOKEN:
          result = await sdk.burnToken(params as BurnTokenOpts);
          break;
        case TransactionType.FREEZE_TOKEN:
          result = await sdk.freezeToken(params as FreezeTokenOpts);
          break;
        case TransactionType.CLAWBACK:
          result = await sdk.clawback(params as ClawbackOpts);
          break;
        case TransactionType.XRP_TRANSFER:
          // const { destination, amount, note } =
          result = await sdk.xrpTransfer(params as XrpTransferOpts);
          break;
        default:
          logger.error(
            `Unknown transaction type: ${transactionType} for vault ${vaultAccountId}`
          );
          throw new ValidationError(
            "InvalidType",
            `Unknown transaction type: ${transactionType}`
          );
      }

      return result;
    } catch (error) {
      logger.error(
        `Error executing ${transactionType} for vault ${vaultAccountId}:`,
        error
      );
      throw error;
    } finally {
      // Always release the SDK back to the pool
      if (sdk) {
        this.sdkManager.releaseSdk(vaultAccountId);
      }
    }
  }

  /**
   * Get metrics about the SDK pool
   */
  public getPoolMetrics(): SdkManagerMetrics {
    return this.sdkManager.getMetrics();
  }

  /**
   * Shut down the API service and all SDK instances
   */
  public async shutdown(): Promise<void> {
    return this.sdkManager.shutdown();
  }
}
