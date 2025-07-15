import {
  tokenTransfer,
  accountSet,
  burnToken,
  clawback,
  freezeToken,
  trustSet,
  xrpTransfer,
} from "../../../src/api/controllers/token.controller";
import { TransactionType } from "../../../src/pool/types";
import { FbksXrpApiService } from "../../../src/api/ApiService";

// Mock the logger so console output does not clutter test logs
jest.mock("../../../src/utils/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("token.controller", () => {
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
      body: { someKey: "someValue" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
    jest.clearAllMocks();
  });

  const controllers = [
    {
      fn: tokenTransfer,
      txType: TransactionType.TOKEN_TRANSFER,
      label: "tokenTransfer",
    },
    {
      fn: accountSet,
      txType: TransactionType.ACCOUNT_SET,
      label: "accountSet",
    },
    { fn: burnToken, txType: TransactionType.BURN_TOKEN, label: "burnToken" },
    { fn: clawback, txType: TransactionType.CLAWBACK, label: "clawback" },
    {
      fn: freezeToken,
      txType: TransactionType.FREEZE_TOKEN,
      label: "freezeToken",
    },
    { fn: trustSet, txType: TransactionType.TRUST_SET, label: "trustSet" },
    {
      fn: xrpTransfer,
      txType: TransactionType.XRP_TRANSFER,
      label: "xrpTransfer",
    },
  ];

  for (const { fn, txType, label } of controllers) {
    describe(label, () => {
      it("returns 200 and result on success", async () => {
        const txResult = { id: "result", ok: true };
        mockApi.executeTransaction.mockResolvedValueOnce(txResult);

        await fn(req, res, next, mockApi);

        expect(mockApi.executeTransaction).toHaveBeenCalledWith({
          vaultAccountId: "vault123",
          transactionType: txType,
          params: req.body,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(txResult);
        expect(next).not.toHaveBeenCalled();
      });

      it("calls next(error) and logs on failure", async () => {
        const err = new Error("fail!");
        mockApi.executeTransaction.mockRejectedValueOnce(err);

        await fn(req, res, next, mockApi);

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(err);
      });

      it("passes the correct request params", async () => {
        await fn(req, res, next, mockApi);

        expect(mockApi.executeTransaction).toHaveBeenCalledWith({
          vaultAccountId: req.params.vaultAccountId,
          transactionType: txType,
          params: req.body,
        });
      });

      it("handles missing vaultAccountId gracefully", async () => {
        req.params = {};
        const err = new Error("No vault");
        mockApi.executeTransaction.mockRejectedValueOnce(err);

        await fn(req, res, next, mockApi);

        // Should call with undefined vaultAccountId
        expect(mockApi.executeTransaction).toHaveBeenCalledWith(
          expect.objectContaining({ vaultAccountId: undefined })
        );
        expect(next).toHaveBeenCalledWith(err);
      });
    });
  }
});
