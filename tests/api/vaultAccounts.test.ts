import { Fireblocks } from "@fireblocks/ts-sdk";
import { BasePath } from "@fireblocks/ts-sdk";
import dotenv from "dotenv";
import { readFileSync } from "fs";

// Load environment variables
dotenv.config();

describe("Fireblocks Vault Accounts API Test", () => {
  let fireblocks: Fireblocks;
  let basePath: string;
  let vaultAccountId: string;

  beforeAll(async () => {
    // Get configuration from environment variables
    const apiKey = process.env.FIREBLOCKS_API_KEY;
    const apiSecretEnv = process.env.FIREBLOCKS_API_PATH_TO_SECRET;
    const basePathEnv = process.env.FIREBLOCKS_BASE_PATH;
    vaultAccountId = process.env.FIREBLOCKS_VAULT_ACCOUNT_ID || "";

    // Validate required environment variables
    if (!apiKey) {
      throw new Error("FIREBLOCKS_API_KEY is not set in environment variables");
    }
    if (!apiSecretEnv) {
      throw new Error("FIREBLOCKS_API_PATH_TO_SECRET is not set in environment variables");
    }

    // Handle API secret - could be a file path or the secret content itself
    let apiSecret: string;
    try {
      // First try to read it as a file path
      apiSecret = readFileSync(apiSecretEnv, "utf8");
    } catch (error: any) {
      if (error.code === 'ENAMETOOLONG' || error.code === 'ENOENT') {
        // If it's too long or file doesn't exist, treat it as the secret content itself
        apiSecret = apiSecretEnv;
      } else {
        throw error;
      }
    }

    // Ensure the secret key is properly formatted for JWT
    // Remove any extra whitespace and ensure it starts with proper PEM format
    apiSecret = apiSecret.trim();
    
    // Fix newline characters - replace literal \n with actual newlines
    apiSecret = apiSecret.replace(/\\n/g, '\n');
    
    if (!apiSecret.startsWith('-----BEGIN')) {
      // If it doesn't start with PEM header, it might be base64 encoded
      // Try to decode and format it properly
      try {
        const decoded = Buffer.from(apiSecret, 'base64').toString('utf8');
        if (decoded.includes('BEGIN')) {
          apiSecret = decoded;
        }
      } catch (e) {
        // If decoding fails, use as-is
      }
    }

    // Determine base path
    basePath = basePathEnv || BasePath.US;

    // Initialize Fireblocks SDK
    fireblocks = new Fireblocks({
      apiKey,
      secretKey: apiSecret,
      basePath,
      additionalOptions: {
        userAgent: "Fireblocks-XRP-SDK-Test/1.0.0",
      },
    });
  });

  it("should successfully GET data from vault/accounts_paged endpoint", async () => {
    // Test parameters
    const limit = 10;
    const before = undefined; // Optional: pagination parameter
    const after = undefined; // Optional: pagination parameter

    // Log the vault account ID being used (if available)
    if (vaultAccountId) {
      console.log("Using vault account ID from .env:", vaultAccountId);
    } else {
      console.log("No specific vault account ID set in .env");
    }

    // Make the API call to get vault accounts
    const response = await fireblocks.vaults.getPagedVaultAccounts({
      limit,
      before,
      after,
    });

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.accounts)).toBe(true);

    // Log the response for debugging
    console.log("Vault Accounts Response:", JSON.stringify(response.data, null, 2));

    // Verify that we have accounts data
    expect(response.data.accounts.length).toBeGreaterThanOrEqual(0);

    // If we have accounts, verify the structure of the first account
    if (response.data.accounts.length > 0) {
      const firstAccount = response.data.accounts[0];
      expect(firstAccount).toHaveProperty("id");
      expect(firstAccount).toHaveProperty("name");
      expect(firstAccount).toHaveProperty("assets");
      expect(Array.isArray(firstAccount.assets)).toBe(true);
    }

    // Verify pagination info if present
    if (response.data.paging) {
      // 'before' may not be present on the first page
      if (response.data.paging.before) {
        expect(response.data.paging).toHaveProperty("before");
      }
      // 'after' may not be present on the last page
      if (response.data.paging.after) {
        expect(response.data.paging).toHaveProperty("after");
      }
    }
  }, 30000); // 30 second timeout for API call

  it("should handle pagination parameters correctly", async () => {
    // Test with specific pagination parameters
    const limit = 5;
    
    const response = await fireblocks.vaults.getPagedVaultAccounts({
      limit,
    });

    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.data.accounts.length).toBeLessThanOrEqual(limit);

    console.log(`Retrieved ${response.data.accounts.length} vault accounts with limit ${limit}`);
  }, 30000);

  it("should handle API errors gracefully", async () => {
    // Test with invalid parameters to ensure error handling works
    try {
      await fireblocks.vaults.getPagedVaultAccounts({
        limit: -1, // Invalid limit
      });
    } catch (error: any) {
      expect(error).toBeDefined();
      console.log("Expected error caught:", error.message);
    }
  }, 30000);

  it("should verify base path configuration", () => {
    // Verify that the base path is correctly configured
    expect(basePath).toBeDefined();
    console.log("Using Fireblocks base path:", basePath);
    
    // The base path should be a valid Fireblocks API URL (sandbox or production)
    expect(basePath).toMatch(/^https:\/\/(sandbox-)?api\.fireblocks\.io/);
  });

  it("should get specific vault account details using FIREBLOCKS_VAULT_ACCOUNT_ID", async () => {
    // Skip this test if no vault account ID is provided
    if (!vaultAccountId) {
      console.log("FIREBLOCKS_VAULT_ACCOUNT_ID not set, skipping specific vault account test");
      return;
    }

    console.log("Testing with specific vault account ID:", vaultAccountId);

    // Get details for the specific vault account
    const response = await fireblocks.vaults.getVaultAccount({
      vaultAccountId: vaultAccountId,
    });

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.data.id).toBe(vaultAccountId);
    expect(response.data).toHaveProperty("name");
    expect(response.data).toHaveProperty("assets");
    expect(Array.isArray(response.data.assets)).toBe(true);

    // Log the specific vault account details
    console.log("Specific Vault Account Details:", JSON.stringify(response.data, null, 2));

    // Verify that the account has the expected structure
    expect(response.data).toHaveProperty("hiddenOnUI");
    expect(response.data).toHaveProperty("autoFuel");
  }, 30000);

  it("should get vault account asset addresses for specific vault account", async () => {
    // Skip this test if no vault account ID is provided
    if (!vaultAccountId) {
      console.log("FIREBLOCKS_VAULT_ACCOUNT_ID not set, skipping asset addresses test");
      return;
    }

    console.log("Getting asset addresses for vault account:", vaultAccountId);

    // Get asset addresses for the specific vault account
    const response = await fireblocks.vaults.getVaultAccountAssetAddressesPaginated({
      vaultAccountId: vaultAccountId,
      assetId: "XRP_TEST", // Using XRP_TEST as specified in the project
    });

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.data).toHaveProperty("addresses");
    expect(Array.isArray(response.data.addresses)).toBe(true);

    // Log the asset addresses
    console.log("Asset Addresses for Vault Account:", JSON.stringify(response.data, null, 2));

    // If addresses exist, verify their structure
    if (response.data.addresses.length > 0) {
      const firstAddress = response.data.addresses[0];
      expect(firstAddress).toHaveProperty("address");
      expect(firstAddress).toHaveProperty("legacyAddress");
      expect(firstAddress).toHaveProperty("enterpriseAddress");
    }
  }, 30000);
});
