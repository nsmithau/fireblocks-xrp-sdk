import { FbksXrpApiService, TransactionType } from "../src/";
import { OracleSetOpts } from "../src/config/types";
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
    // Example OracleSet transaction based on XRPL documentation
    // https://xrpl.org/docs/references/protocol/transactions/types/oracleset
    const params: OracleSetOpts = {
      OracleDocumentID: 34,
      Provider: "70726F7669646572", // "provider" in hex
      LastUpdateTime: Math.floor(Date.now() / 1000), // Current Unix timestamp
      AssetClass: "63757272656E6379", // "currency" in hex
      PriceDataSeries: [
        {
          PriceData: {
            BaseAsset: "XRP",
            QuoteAsset: "USD",
            AssetPrice: "2850", // 2850 with scale 3 = 2.850 (current market price)
            Scale: 3,
          },
        },
        {
          PriceData: {
            BaseAsset: "BTC",
            QuoteAsset: "USD",
            AssetPrice: "121424000", // 121424000 with scale 3 = 121424.000 (current market price)
            Scale: 3,
          },
        },
      ],
    };

    const opts: ExecuteTransactionOpts = {
      vaultAccountId: process.env.FIREBLOCKS_VAULT_ACCOUNT_ID || "",
      transactionType: TransactionType.ORACLE_SET,
      params,
    };

    console.log("Creating OracleSet transaction with the following parameters:");
    console.log(`Oracle Document ID: ${params.OracleDocumentID}`);
    console.log(`Provider: ${params.Provider} (${Buffer.from(params.Provider, 'hex').toString('utf8')})`);
    console.log(`Asset Class: ${params.AssetClass} (${Buffer.from(params.AssetClass, 'hex').toString('utf8')})`);
    console.log(`Last Update Time: ${params.LastUpdateTime} (${new Date(params.LastUpdateTime * 1000).toISOString()})`);
    console.log(`Price Data Series: ${params.PriceDataSeries.length} price pairs`);
    params.PriceDataSeries.forEach((item, index) => {
      const price = item.PriceData;
      console.log(`  ${index + 1}. ${price.BaseAsset}/${price.QuoteAsset}: ${price.AssetPrice} (scale: ${price.Scale})`);
    });

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
    console.error("Error in oracleSet example:", error);
  } finally {
    await apiService.shutdown();
  }
})();
