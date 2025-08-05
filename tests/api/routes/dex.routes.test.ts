import request from "supertest";
import express from "express";
import { configureDexRoutes } from "../../../src/api/routes/dex.routes";
import { FbksXrpApiService } from "../../../src/api/ApiService";
import { TransactionType } from "../../../src/pool/types";
import { TxResponse, Transaction } from "xrpl";

// Silence logger output in tests
jest.mock("../../../src/utils/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock("../../../src/api/ApiService");

const mockApi = {
  executeTransaction: jest.fn(),
};

const app = express();
app.use(express.json());
app.use("/", configureDexRoutes(mockApi as unknown as FbksXrpApiService));

const vaultAccountId = "vault123";
const fakeXrpResponse: TxResponse<Transaction> = {
  id: "mocked-id",
  type: "submit",
  result: {
    hash: "abc123",
    meta: "",
    tx_json: {} as Transaction,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockApi.executeTransaction.mockResolvedValue(fakeXrpResponse);
});

const endpoints = [
  {
    url: "offerCreate",
    type: TransactionType.OFFER_CREATE,
  },
  {
    url: "offerCancel",
    type: TransactionType.OFFER_CANCEL,
  },
  {
    url: "crossCurrencyPayment",
    type: TransactionType.CROSS_CURRENCY_PAYMENT,
  },
  {
    url: "credentialCreate",
    type: TransactionType.CREDENTIAL_CREATE,
  },
  {
    url: "credentialAccept",
    type: TransactionType.CREDENTIAL_ACCEPT,
  },
  {
    url: "credentialDelete",
    type: TransactionType.CREDENTIAL_DELETE,
  },
];

describe("DEX Routes", () => {
  for (const { url, type } of endpoints) {
    it(`calls executeTransaction for ${url}`, async () => {
      const res = await request(app)
        .post(`/api/dex/${url}/${vaultAccountId}`)
        .send({ test: true });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeXrpResponse);
      expect(mockApi.executeTransaction).toHaveBeenCalledWith({
        vaultAccountId,
        transactionType: type,
        params: { test: true },
      });
    });

    it(`returns 400 if vaultAccountId is missing for ${url}`, async () => {
      const res = await request(app)
        .post(`/api/dex/${url}`)
        .send({ test: true });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Missing vault account ID",
        message: "Vault account Id is missing from the request URL",
      });
    });
  }
});
