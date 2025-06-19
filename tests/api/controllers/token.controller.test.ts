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
import { TransactionResponse } from "@fireblocks/ts-sdk";

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
      body: { key: "value" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
    jest.clearAllMocks();
  });

  const testCases = [
    {
      fn: tokenTransfer,
      type: TransactionType.TOKEN_TRANSFER,
      label: "tokenTransfer",
    },
    { fn: accountSet, type: TransactionType.ACCOUNT_SET, label: "accountSet" },
    { fn: burnToken, type: TransactionType.BURN_TOKEN, label: "burnToken" },
    { fn: clawback, type: TransactionType.CLAWBACK, label: "clawback" },
    {
      fn: freezeToken,
      type: TransactionType.FREEZE_TOKEN,
      label: "freezeToken",
    },
    { fn: trustSet, type: TransactionType.TRUST_SET, label: "trustSet" },
    {
      fn: xrpTransfer,
      type: TransactionType.XRP_TRANSFER,
      label: "xrpTransfer",
    },
  ];

  for (const { fn, type, label } of testCases) {
    describe(label, () => {
      it(`should call executeTransaction with ${type} and return 200`, async () => {
        const fakeRes: TransactionResponse = {
          id: "abc123",
          status: "COMPLETED",
          txHash: "mockedTxHash",
          createdAt: 12345678,
        };

        mockApi.executeTransaction.mockResolvedValue(fakeRes);

        await fn(req, res, next, mockApi);

        expect(mockApi.executeTransaction).toHaveBeenCalledWith(
          "vault123",
          type,
          { key: "value" }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(fakeRes);
      });

      it("should handle errors and call next", async () => {
        const error = new Error("test failure");
        mockApi.executeTransaction.mockRejectedValue(error);

        await fn(req, res, next, mockApi);

        expect(next).toHaveBeenCalledWith(error);
      });
    });
  }
});
