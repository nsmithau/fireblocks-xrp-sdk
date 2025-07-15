import request from "supertest";
import express from "express";
import { configureTokenRoutes } from "../../../src/api/routes/token.routes";
import { FbksXrpApiService } from "../../../src/api/ApiService";
import { TransactionType } from "../../../src/pool/types";
import { TxResponse, Transaction } from "xrpl";

jest.mock("../../../src/api/ApiService");

const mockApi = {
  executeTransaction: jest.fn(),
};

const app = express();
app.use(express.json());
app.use("/", configureTokenRoutes(mockApi as unknown as FbksXrpApiService));

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

describe("Token Routes", () => {
  const routes = [
    { path: "tokenTransfer", type: TransactionType.TOKEN_TRANSFER },
    { path: "accountSet", type: TransactionType.ACCOUNT_SET },
    { path: "burnToken", type: TransactionType.BURN_TOKEN },
    { path: "clawback", type: TransactionType.CLAWBACK },
    { path: "freezeToken", type: TransactionType.FREEZE_TOKEN },
    { path: "trustSet", type: TransactionType.TRUST_SET },
    { path: "xrpTransfer", type: TransactionType.XRP_TRANSFER },
  ];

  routes.forEach(({ path, type }) => {
    it(`calls executeTransaction for ${path}`, async () => {
      const res = await request(app)
        .post(`/api/token/${path}/${vaultAccountId}`)
        .send({ test: true });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeXrpResponse);
      expect(mockApi.executeTransaction).toHaveBeenCalledWith({
        vaultAccountId,
        transactionType: type,
        params: { test: true },
      });
    });
  });

  it("returns 400 if vaultAccountId is missing", async () => {
    const res = await request(app).post(`/api/token/tokenTransfer`).send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Missing vault account ID",
      message: "Vault account Id is missing from the request URL",
    });
  });
});
