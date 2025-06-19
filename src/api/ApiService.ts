import { BasePath, TransactionResponse } from "@fireblocks/ts-sdk";
import { TxResponse } from "xrpl";
import { SdkManager } from "../pool/SdkManager";
import { ApiServiceConfig, TransactionType } from "../pool/types";
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
    params: any
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
          const { destination, amount, note } = params as XrpTransferOpts;
          result = await sdk.xrpTransfer({
            destination,
            amount,
            note,
          });
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
  public getPoolMetrics() {
    return this.sdkManager.getMetrics();
  }

  /**
   * Shut down the API service and all SDK instances
   */
  public async shutdown(): Promise<void> {
    return this.sdkManager.shutdown();
  }
}
