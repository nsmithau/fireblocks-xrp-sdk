# OracleSet Transaction Guide

This guide shows you how to run an OracleSet transaction using your `.env` file with Fireblocks.

## Prerequisites

1. **Environment Variables**: Make sure your `.env` file contains:
   ```bash
   FIREBLOCKS_API_KEY=your_api_key_here
   FIREBLOCKS_API_PATH_TO_SECRET=path_to_your_secret_key_file
   FIREBLOCKS_VAULT_ACCOUNT_ID=your_vault_account_id
   FIREBLOCKS_ASSET_ID=XRP_TEST
   FIREBLOCKS_BASE_PATH=https://sandbox-api.fireblocks.io/v1
   ```

2. **Dependencies**: Install all required packages:
   ```bash
   npm install
   ```

## Method 1: Using the Simple Script

Run the provided script that handles everything:

```bash
node run-oracle-set.js
```

This script will:
- ✅ Check if `.env` file exists
- ✅ Load environment variables
- ✅ Execute the OracleSet transaction
- ✅ Show detailed output and error handling

## Method 2: Direct TypeScript Execution

Run the OracleSet example directly:

```bash
npx ts-node examples/oracleSet.example.ts
```

## Method 3: Using npm Script (if configured)

If you have a script in `package.json`:

```bash
npm run oracle-set
```

## What the OracleSet Transaction Does

The example creates an Oracle with the following data:

### Transaction Parameters:
- **Oracle Document ID**: 34
- **Provider**: "provider" (hex encoded as `70726F7669646572`)
- **Asset Class**: "currency" (hex encoded as `63757272656E6379`)
- **Last Update Time**: Current Unix timestamp
- **Price Data Series**:
  - XRP/USD: 2.850 (scale 3) - Current market price
  - BTC/USD: 121424.000 (scale 3) - Current market price

### Expected Output:
```
Creating OracleSet transaction with the following parameters:
Oracle Document ID: 34
Provider: 70726F7669646572 (provider)
Asset Class: 63757272656E6379 (currency)
Last Update Time: 1703123456 (2023-12-21T10:30:56.000Z)
Price Data Series: 2 price pairs
  1. XRP/USD: 2850 (scale: 3) = $2.850
  2. BTC/USD: 121424000 (scale: 3) = $121,424.000

Tx submitted successfully with hash: ABC123...
Tx metadata: {...}
```

## Troubleshooting

### Common Issues:

1. **Missing .env file**:
   ```
   ❌ Error: .env file not found!
   ```
   **Solution**: Create a `.env` file with the required variables.

2. **Invalid API credentials**:
   ```
   ❌ Error: Invalid API key or secret
   ```
   **Solution**: Check your `FIREBLOCKS_API_KEY` and `FIREBLOCKS_API_PATH_TO_SECRET` values.

3. **Vault account not found**:
   ```
   ❌ Error: Vault account not found
   ```
   **Solution**: Verify your `FIREBLOCKS_VAULT_ACCOUNT_ID` exists in Fireblocks.

4. **Missing dependencies**:
   ```
   ❌ Error: Cannot find module 'ripple-binary-codec'
   ```
   **Solution**: Run `npm install` to install all dependencies.

### Environment Variable Details:

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBLOCKS_API_KEY` | Your Fireblocks API key UUID | `12345678-1234-1234-1234-123456789abc` |
| `FIREBLOCKS_API_PATH_TO_SECRET` | Path to your private key file | `./secrets/fireblocks_secret.key` |
| `FIREBLOCKS_VAULT_ACCOUNT_ID` | Your vault account ID | `15` |
| `FIREBLOCKS_ASSET_ID` | Asset type (XRP_TEST for testnet) | `XRP_TEST` |
| `FIREBLOCKS_BASE_PATH` | Fireblocks API base URL | `https://sandbox-api.fireblocks.io/v1` |

## Customizing the OracleSet Transaction

You can modify the `examples/oracleSet.example.ts` file to:

1. **Change the Oracle Document ID**:
   ```typescript
   OracleDocumentID: 123, // Your custom ID
   ```

2. **Add more price pairs**:
   ```typescript
   PriceDataSeries: [
     {
       PriceData: {
         BaseAsset: "XRP",
         QuoteAsset: "USD",
         AssetPrice: "500000", // 500.000 with scale 3
         Scale: 3,
       },
     },
     {
       PriceData: {
         BaseAsset: "ETH",
         QuoteAsset: "USD",
         AssetPrice: "3000000", // 3000.000 with scale 3
         Scale: 3,
       },
     },
   ],
   ```

3. **Change the provider**:
   ```typescript
   Provider: "436861696E6C696E6B", // "Chainlink" in hex
   ```

4. **Add a URI**:
   ```typescript
   URI: "68747470733A2F2F6170692E6578616D706C652E636F6D", // "https://api.example.com" in hex
   ```

## Next Steps

After running the OracleSet transaction:

1. **Check the transaction status** in Fireblocks Console
2. **Verify the Oracle was created** on the XRPL
3. **Use OracleDelete** to remove the Oracle if needed
4. **Update the Oracle** with new price data

## Related Files

- `examples/oracleSet.example.ts` - Main OracleSet example
- `examples/oracleDelete.example.ts` - OracleDelete example
- `tests/api/oracleSet.unit.test.ts` - Unit tests
- `tests/api/oracleSet.integration.test.ts` - Integration tests
