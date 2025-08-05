import {
  offerCreate,
  offerCancel,
  crossCurrencyPayment,
  credentialCreate,
  credentialAccept,
  credentialDelete,
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

  const tests = [
    {
      fn: offerCreate,
      type: TransactionType.OFFER_CREATE,
      label: "offerCreate",
      errorLabel: "Offer Create",
    },
    {
      fn: offerCancel,
      type: TransactionType.OFFER_CANCEL,
      label: "offerCancel",
      errorLabel: "OfferCancel",
    },
    {
      fn: crossCurrencyPayment,
      type: TransactionType.CROSS_CURRENCY_PAYMENT,
      label: "crossCurrencyPayment",
      errorLabel: "Cross Currency Payment",
    },
    {
      fn: credentialCreate,
      type: TransactionType.CREDENTIAL_CREATE,
      label: "credentialCreate",
      errorLabel: "CredentialCreate",
    },
    {
      fn: credentialAccept,
      type: TransactionType.CREDENTIAL_ACCEPT,
      label: "credentialAccept",
      errorLabel: "CredentialAccept",
    },
    {
      fn: credentialDelete,
      type: TransactionType.CREDENTIAL_DELETE,
      label: "credentialDelete",
      errorLabel: "CredentialDelete",
    },
  ];

  for (const { fn, type, label } of tests) {
    describe(label, () => {
      it(`should call api.executeTransaction with ${type} and return 200`, async () => {
        const fakeResponse = { id: `${label}_id` };
        mockApi.executeTransaction.mockResolvedValue(fakeResponse);

        await fn(req, res, next, mockApi);

        expect(mockApi.executeTransaction).toHaveBeenCalledWith({
          vaultAccountId: "vault123",
          transactionType: type,
          params: { foo: "bar" },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(fakeResponse);
        expect(next).not.toHaveBeenCalled();
      });

      it("should handle error and call next", async () => {
        const error = new Error(`fail for ${label}`);
        mockApi.executeTransaction.mockRejectedValue(error);

        await fn(req, res, next, mockApi);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });
    });
  }
});
