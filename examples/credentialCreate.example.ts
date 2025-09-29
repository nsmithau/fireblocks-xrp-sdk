import {
  FbksXrpApiService,
  TransactionType,
  CredentialCreateOpts,
} from "../src/";
import { BasePath } from "@fireblocks/ts-sdk";
import { ExecuteTransactionOpts } from "../src/config/types";

(async () => {
  const apiService = new FbksXrpApiService({
    apiKey: process.env.FIREBLOCKS_API_KEY || "",
    apiSecret: process.env.FIREBLOCKS_SECRET_KEY || "",
    assetId: process.env.FIREBLOCKS_ASSET_ID || "XRP_TEST",
    basePath: (process.env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  });

  try {
    const params: CredentialCreateOpts = {
      subject: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe", // XRPL testnet address
      credentialType: "43455254", // Hex for "CERT"
      expiration: 800000000, // optional, Ripple Epoch seconds
      uri: "68747470733A2F2F6578616D706C652E636F6D2F637265642F313233", // hex for 'https://example.com/cred/123'
    };

    const opts: ExecuteTransactionOpts = {
      vaultAccountId: process.env.FIREBLOCKS_VAULT_ACCOUNT_ID || "",
      transactionType: TransactionType.CREDENTIAL_CREATE,
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
    console.error("Error in credentialCreate example:", error);
  } finally {
    await apiService.shutdown();
  }
})();
