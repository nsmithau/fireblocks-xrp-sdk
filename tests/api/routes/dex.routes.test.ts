import request from "supertest";
import express from "express";
import { configureDexRoutes } from "../../../src/api/routes/dex.routes";
import { FbksXrpApiService } from "../../../src/api/ApiService";
import { TransactionType } from "../../../src/pool/types";
import { TxResponse } from "xrpl";
import { Transaction } from "xrpl";

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

describe("DEX Routes", () => {
  it("calls executeTransaction for offerCreate", async () => {
    const res = await request(app)
      .post(`/api/dex/offerCreate/${vaultAccountId}`)
      .send({ test: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeXrpResponse);
    expect(mockApi.executeTransaction).toHaveBeenCalledWith(
      vaultAccountId,
      TransactionType.OFFER_CREATE,
      { test: true }
    );
  });

  it("calls executeTransaction for offerCancel", async () => {
    const res = await request(app)
      .post(`/api/dex/offerCancel/${vaultAccountId}`)
      .send({ test: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeXrpResponse);
    expect(mockApi.executeTransaction).toHaveBeenCalledWith(
      vaultAccountId,
      TransactionType.OFFER_CANCEL,
      { test: true }
    );
  });

  it("calls executeTransaction for crossCurrencyPayment", async () => {
    const res = await request(app)
      .post(`/api/dex/crossCurrencyPayment/${vaultAccountId}`)
      .send({ test: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeXrpResponse);
    expect(mockApi.executeTransaction).toHaveBeenCalledWith(
      vaultAccountId,
      TransactionType.CROSS_CURRENCY_PAYMENT,
      { test: true }
    );
  });

  it("returns 400 if vaultAccountId is missing", async () => {
    const res = await request(app).post(`/api/dex/offerCreate`).send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Missing vault account ID",
      message: "Vault account Id is missing from the request URL",
    });
  });
});
