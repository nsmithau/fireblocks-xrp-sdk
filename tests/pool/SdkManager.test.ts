// tests/pool/SdkManager.test.ts
import { SdkManager } from "../../src/pool/SdkManager";
import { FireblocksXrpSdk, FireblocksConfig } from "../../src/FireblocksXrpSdk";
import { PoolConfig } from "../../src/pool/types";
import { BasePath } from "@fireblocks/ts-sdk";

jest.useFakeTimers();

// Mock SDK instance
const mockSdkInstance = {
  shutDown: jest.fn(),
  client: { isConnected: jest.fn(() => true), connect: jest.fn() },
} as any;

// Properly mock the FireblocksXrpSdk class and its static methods
jest.mock("../../src/FireblocksXrpSdk", () => {
  const actual = jest.requireActual("../../src/FireblocksXrpSdk");

  return {
    ...actual,
    FireblocksXrpSdk: jest.fn().mockImplementation(() => mockSdkInstance),
  };
});

(FireblocksXrpSdk as any).createFireblocksInstance = jest.fn(() => ({}));
(FireblocksXrpSdk as any).fetchXrpAccountInfo = jest.fn(() =>
  Promise.resolve({ address: "rAddr", publicKey: "pubKey" })
);

describe("SdkManager", () => {
  const baseConfig: Omit<FireblocksConfig, "vaultAccountId"> = {
    apiKey: "key",
    apiSecret: "secret",
    assetId: "XRP_TEST",
    basePath: "US" as BasePath,
  };

  const poolConfig: Partial<PoolConfig> = {
    maxPoolSize: 2,
    idleTimeoutMs: 1000,
    cleanupIntervalMs: 1000,
  };

  let manager: SdkManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new SdkManager(baseConfig, poolConfig);
  });

  it("creates and caches new SDK instances", async () => {
    const sdk = await manager.getSdk("vault1");
    expect(sdk).toBeDefined();
    expect(await manager.getSdk("vault1")).toBe(sdk); // Reuse same
  });

  it("reuses idle instances", async () => {
    const sdk = await manager.getSdk("vault2");
    manager.releaseSdk("vault2");
    const reused = await manager.getSdk("vault2");
    expect(reused).toBe(sdk);
  });

  it("removes oldest idle if pool is full", async () => {
    const sdk1 = await manager.getSdk("v1");
    const sdk2 = await manager.getSdk("v2");

    // Mark sdk1 as idle and older
    manager.releaseSdk("v1");

    // Artificially age sdk1's lastUsed timestamp
    const idleItem = (manager as any).sdkPool.get("v1");
    idleItem.lastUsed = new Date(Date.now() - 1000 * 60 * 10); // 10 minutes ago

    const spy = jest.spyOn<any, any>(manager as any, "removeOldestIdleSdk");

    const sdk3 = await manager.getSdk("v3");

    expect(spy).toHaveBeenCalled();
    expect(sdk3).toBeDefined();

    const metrics = manager.getMetrics();
    expect(metrics.totalInstances).toBe(2);
    expect(Object.keys(metrics.instancesByVaultAccount)).toContain("v3");
    expect(Object.keys(metrics.instancesByVaultAccount)).toContain("v2");
  });

  it("throws if pool is full and no idle instance to evict", async () => {
    await manager.getSdk("v1");
    await manager.getSdk("v2");
    await expect(manager.getSdk("v3")).rejects.toThrow(
      "SDK pool is at maximum capacity"
    );
  });

  it("updates metrics correctly", async () => {
    await manager.getSdk("v1");
    await manager.getSdk("v2");
    manager.releaseSdk("v1");

    const metrics = manager.getMetrics();
    expect(metrics.totalInstances).toBe(2);
    expect(metrics.activeInstances).toBe(1);
    expect(metrics.idleInstances).toBe(1);
    expect(metrics.instancesByVaultAccount).toEqual({
      v1: false,
      v2: true,
    });
  });

  it("cleans up idle SDKs after timeout", async () => {
    await manager.getSdk("v1");
    manager.releaseSdk("v1");

    jest.advanceTimersByTime(2000); // simulate idle time

    await (manager as any).cleanupIdleSdks();
    const metrics = manager.getMetrics();
    expect(metrics.totalInstances).toBe(0);
  });

  it("shuts down all SDKs on shutdown()", async () => {
    await manager.getSdk("v1");
    await manager.getSdk("v2");

    await manager.shutdown();
    const metrics = manager.getMetrics();
    expect(metrics.totalInstances).toBe(0);
  });
});
