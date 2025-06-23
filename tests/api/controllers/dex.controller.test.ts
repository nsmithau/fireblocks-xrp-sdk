import {
  offerCreate,
  offerCancel,
  crossCurrencyPayment,
} from "../../../src/api/controllers";
import { TransactionType } from "../../../src/pool/types";
import { FbksXrpApiService } from "../../../src/api/ApiService";

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

      expect(mockApi.executeTransaction).toHaveBeenCalledWith(
        "vault123",
        TransactionType.OFFER_CREATE,
        { foo: "bar" }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeResponse);
    });

    it("should handle error and call next", async () => {
      const error = new Error("Oops");
      mockApi.executeTransaction.mockRejectedValue(error);

      await offerCreate(req, res, next, mockApi);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("offerCancel", () => {
    it("should call api.executeTransaction with OFFER_CANCEL and return 200", async () => {
      const fakeResponse = { id: "tx456" };
      mockApi.executeTransaction.mockResolvedValue(fakeResponse);

      await offerCancel(req, res, next, mockApi);

      expect(mockApi.executeTransaction).toHaveBeenCalledWith(
        "vault123",
        TransactionType.OFFER_CANCEL,
        { foo: "bar" }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeResponse);
    });

    it("should handle error and call next", async () => {
      const error = new Error("fail cancel");
      mockApi.executeTransaction.mockRejectedValue(error);

      await offerCancel(req, res, next, mockApi);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("crossCurrencyPayment", () => {
    it("should call api.executeTransaction with CROSS_CURRENCY_PAYMENT and return 200", async () => {
      const fakeResponse = { id: "tx789" };
      mockApi.executeTransaction.mockResolvedValue(fakeResponse);

      await crossCurrencyPayment(req, res, next, mockApi);

      expect(mockApi.executeTransaction).toHaveBeenCalledWith(
        "vault123",
        TransactionType.CROSS_CURRENCY_PAYMENT,
        { foo: "bar" }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeResponse);
    });

    it("should handle error and call next", async () => {
      const error = new Error("payment error");
      mockApi.executeTransaction.mockRejectedValue(error);

      await crossCurrencyPayment(req, res, next, mockApi);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
