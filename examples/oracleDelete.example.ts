import { FbksXrpApiService, TransactionType } from "../src/";
import { OracleDeleteOpts } from "../src/config/types";
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
    // Example OracleDelete transaction based on XRPL documentation
    // https://xrpl.org/docs/references/protocol/transactions/types/oracledelete
    const params: OracleDeleteOpts = {
      OracleDocumentID: 34, // Must match an existing Oracle Document ID
    };

    const opts: ExecuteTransactionOpts = {
      vaultAccountId: process.env.FIREBLOCKS_VAULT_ACCOUNT_ID || "",
      transactionType: TransactionType.ORACLE_DELETE,
      params,
    };

    console.log("Creating OracleDelete transaction with the following parameters:");
    console.log(`Oracle Document ID to delete: ${params.OracleDocumentID}`);
    console.log("Note: This will delete the price oracle with the specified Document ID");
    console.log("Make sure the Oracle Document ID exists and is owned by this account");

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
        if (res.result.meta.TransactionResult === "tecNO_ENTRY") {
          console.log("Error: The Oracle object doesn't exist with the specified Document ID");
        }
      } else {
        console.log(`Tx submitted successfully with hash: ${res.result.hash}`);
        console.log(`Tx metadata: ${JSON.stringify(res.result.meta, null, 2)}`);
        console.log("Oracle successfully deleted!");
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
    console.error("Error in oracleDelete example:", error);
    if (error instanceof Error && error.message.includes("tecNO_ENTRY")) {
      console.log("The Oracle object with the specified Document ID doesn't exist");
    }
  } finally {
    await apiService.shutdown();
  }
})();
