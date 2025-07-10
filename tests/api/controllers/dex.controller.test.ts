import {
  offerCreate,
  offerCancel,
  crossCurrencyPayment,
} from "../../../src/api/controllers";
import { TransactionType } from "../../../src/pool/types";
import { FbksXrpApiService } from "../../../src/api/ApiService";

// Mock the logger to keep output clean during tests
jest.mock("../../../src/utils/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("dex.controller", () => {
  let mockApi: jest.Mocked<FbksXrpApiService>;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockApi = {
      executeTransaction: jest.fn(),
    } as unknown as jest.Mocked<FbksXrpApiService>;

    req = {
      params: { vaultAccountId: "vault123" },
      body: { foo: "bar" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("offerCreate", () => {
    it("should call api.executeTransaction with OFFER_CREATE and return 200", async () => {
      const fakeResponse = { id: "tx123" };
      mockApi.executeTransaction.mockResolvedValue(fakeResponse);

      await offerCreate(req, res, next, mockApi);

      expect(mockApi.executeTransaction).toHaveBeenCalledWith({
        vaultAccountId: "vault123",
        transactionType: TransactionType.OFFER_CREATE,
        params: { foo: "bar" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle error and call next", async () => {
      const error = new Error("Oops");
      mockApi.executeTransaction.mockRejectedValue(error);

      await offerCreate(req, res, next, mockApi);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("offerCancel", () => {
    it("should call api.executeTransaction with OFFER_CANCEL and return 200", async () => {
      const fakeResponse = { id: "tx456" };
      mockApi.executeTransaction.mockResolvedValue(fakeResponse);

      await offerCancel(req, res, next, mockApi);

      expect(mockApi.executeTransaction).toHaveBeenCalledWith({
        vaultAccountId: "vault123",
        transactionType: TransactionType.OFFER_CANCEL,
        params: { foo: "bar" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle error and call next", async () => {
      const error = new Error("fail cancel");
      mockApi.executeTransaction.mockRejectedValue(error);

      await offerCancel(req, res, next, mockApi);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("crossCurrencyPayment", () => {
    it("should call api.executeTransaction with CROSS_CURRENCY_PAYMENT and return 200", async () => {
      const fakeResponse = { id: "tx789" };
      mockApi.executeTransaction.mockResolvedValue(fakeResponse);

      await crossCurrencyPayment(req, res, next, mockApi);

      expect(mockApi.executeTransaction).toHaveBeenCalledWith({
        vaultAccountId: "vault123",
        transactionType: TransactionType.CROSS_CURRENCY_PAYMENT,
        params: { foo: "bar" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle error and call next", async () => {
      const error = new Error("payment error");
      mockApi.executeTransaction.mockRejectedValue(error);

      await crossCurrencyPayment(req, res, next, mockApi);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
