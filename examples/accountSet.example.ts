import { FbksXrpApiService, AccountSetOpts, TransactionType } from "../src/";
import { BasePath } from "@fireblocks/ts-sdk";
import { ExecuteTransactionOpts } from "../src/config/types";

(async () => {
  const apiService = new FbksXrpApiService({
    apiKey: process.env.FIREBLOCKS_API_KEY || "",
    apiSecret: process.env.FIREBLOCKS_API_PATH_TO_SECRET || "",
    assetId: process.env.FIREBLOCKS_ASSET_ID || "XRP_TEST",
    basePath: (process.env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  });
  try {
    const params: AccountSetOpts = {
      configs: {
        setFlag: {
          asfDefaultRipple: true,
        },
        tfFlags: {
          tfRequireDestTag: true,
          tfRequireAuth: true,
        },
        domain: "example.com",
        transferRate: 1000000000,
        tickSize: 5,
      },
    };
    const opts: ExecuteTransactionOpts = {
      vaultAccountId: process.env.FIREBLOCKS_VAULT_ACCOUNT_ID || "",
      transactionType: TransactionType.ACCOUNT_SET,
      params,
    };
    const res = await apiService.executeTransaction(opts);

    // Need to check which type of response we got
    if ("result" in res) {
      // This is a TxResponse from XRPL
      if (
        typeof res.result.meta === "object" &&
        res.result.meta?.TransactionResult !== "tesSUCCESS"
      ) {
        console.log(
          `Tx submission failed with result: ${res.result.meta.TransactionResult}`
        );
      } else {
        console.log(`Tx submitted successfully with hash: ${res.result.hash}`);
        console.log(`Tx metadata: ${JSON.stringify(res.result.meta, null, 2)}`);
      }
    } else {
      // This is a TransactionResponse from Fireblocks
      console.log(`Transaction submitted with ID: ${res.id}`);
      console.log(`Status: ${res.status}`);
      if (res.txHash) {
        console.log(`Transaction hash: ${res.txHash}`);
      }
    }
  } catch (error) {
    console.error("Error in offerCreate example:", error);
  } finally {
    await apiService.shutdown();
  }
})();
