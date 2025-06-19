import express, { Express } from "express";
import request from "supertest";
import { configureTokenRoutes } from "../../../src/api/routes/token.routes";
import { FbksXrpApiService } from "../../../src/api/ApiService";
import { TransactionResponse } from "@fireblocks/ts-sdk";

jest.mock("../../../src/api/ApiService");

describe("Token Routes", () => {
  let app: Express;
  const mockApi = {
    executeTransaction: jest.fn(),
  } as unknown as jest.Mocked<FbksXrpApiService>;

  const vaultAccountId = "vault123";

  const fakeXrpResponse = {
    id: "abc123",
    type: "Payment",
    result: {
      hash: "txhash",
      meta: {},
      tx_json: { TransactionType: "Payment" },
    },
  };

  const fakeFbksResponse: TransactionResponse = {
    id: "tx456",
    status: "COMPLETED",
    createdAt: 123456789,
    assetId: "XRP",
    source: {
      type: "VAULT_ACCOUNT",
      id: "1", // required when type is VAULT_ACCOUNT
    },
    destination: {
      type: "ONE_TIME_ADDRESS",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use(configureTokenRoutes(mockApi));
  });

  const tokenRoutes = [
    "tokenTransfer",
    "accountSet",
    "burnToken",
    "clawback",
    "freezeToken",
    "trustSet",
    "xrpTransfer",
  ];

  for (const route of tokenRoutes) {
    it(`calls executeTransaction for ${route}`, async () => {
      const endpoint = `/api/token/${route}/${vaultAccountId}`;

      // Determine expected result format
      const expectedResponse =
        route === "xrpTransfer" ? fakeFbksResponse : fakeXrpResponse;

      // Mock based on route
      mockApi.executeTransaction.mockImplementation((_, type) => {
        return type === "xrpTransfer"
          ? Promise.resolve(fakeFbksResponse)
          : Promise.resolve(fakeXrpResponse);
      });

      const res = await request(app).post(endpoint).send({ test: true });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expectedResponse);
      expect(mockApi.executeTransaction).toHaveBeenCalledWith(
        vaultAccountId,
        route,
        { test: true }
      );
    });

    it(`returns 400 if vault account is missing for ${route}`, async () => {
      const res = await request(app)
        .post(`/api/token/${route}`)
        .send({ test: true });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Missing vault account ID",
        message: "Vault account Id is missing from the request URL",
      });
    });
  }
});
