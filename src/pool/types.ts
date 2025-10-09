import { FireblocksXrpSdk } from "../FireblocksXrpSdk";
import { BasePath } from "@fireblocks/ts-sdk";

export interface PoolConfig {
  maxPoolSize: number;
  idleTimeoutMs: number;
  cleanupIntervalMs: number;
  connectionTimeoutMs: number;
  retryAttempts: number;
}

export interface SdkPoolItem {
  sdk: FireblocksXrpSdk;
  lastUsed: Date;
  isInUse: boolean;
}

export interface ApiServiceConfig {
  apiKey: string;
  apiSecret: string;
  assetId: string;
  basePath: BasePath | string;
  poolConfig?: Partial<PoolConfig>;
}

export enum TransactionType {
  OFFER_CREATE = "offerCreate",
  OFFER_CANCEL = "offerCancel",
  CROSS_CURRENCY_PAYMENT = "crossCurrencyPayment",
  CREDENTIAL_CREATE = "credentialCreate",
  CREDENTIAL_ACCEPT = "credentialAccept",
  CREDENTIAL_DELETE = "credentialDelete",
  ACCOUNT_SET = "accountSet",
  TRUST_SET = "trustSet",
  TOKEN_TRANSFER = "tokenTransfer",
  BURN_TOKEN = "burnToken",
  FREEZE_TOKEN = "freezeToken",
  CLAWBACK = "clawback",
  XRP_TRANSFER = "xrpTransfer",
  ORACLE_SET = "oracleSet",
  ORACLE_DELETE = "oracleDelete",
}

export interface SdkManagerMetrics {
  totalInstances: number;
  activeInstances: number;
  idleInstances: number;
  instancesByVaultAccount: Record<string, boolean>;
}
