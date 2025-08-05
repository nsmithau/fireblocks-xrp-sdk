import {
  FbksXrpApiService,
  TransactionType,
  CredentialDeleteOpts,
} from "../src/";
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
    const params: CredentialDeleteOpts = {
      credentialType: "43455254", // Hex for "CERT"
      issuer: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe", // Optional if using subject only
      subject: "rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1", // Optionally use testnet subject address
    };

    const opts: ExecuteTransactionOpts = {
      vaultAccountId: process.env.FIREBLOCKS_VAULT_ACCOUNT_ID || "",
      transactionType: TransactionType.CREDENTIAL_DELETE,
      params,
    };

    const res = await apiService.executeTransaction(opts);

    if ("result" in res) {
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
      console.log(`Transaction submitted with ID: ${res.id}`);
      console.log(`Status: ${res.status}`);
      if (res.txHash) {
        console.log(`Transaction hash: ${res.txHash}`);
      }
    }
  } catch (error) {
    console.error("Error in credentialDelete example:", error);
  } finally {
    await apiService.shutdown();
  }
})();
