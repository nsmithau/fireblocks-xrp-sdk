// src/api/routes/swagger.routes.ts
import { Router, Request, Response } from "express";
const router = Router();

// ---------- DEX Endpoints ----------

router.post(
  "/api/dex/offerCreate/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['DEX']
    // #swagger.summary = 'Create an Offer'
    // #swagger.description = 'Creates an offer on the XRP Ledger DEX.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/OfferCreateRequest" } } } }
    // #swagger.responses[200] = { description: 'OfferCreateResponse', schema: { $ref: "#/definitions/OfferCreateResponse" } }
  }
);

router.post(
  "/api/dex/offerCancel/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['DEX']
    // #swagger.summary = 'Cancel an Offer'
    // #swagger.description = 'Cancels an existing offer on the XRP Ledger DEX.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/OfferCancelRequest" } } } }
    // #swagger.responses[200] = { description: 'OfferCancelResponse', schema: { $ref: "#/definitions/OfferCancelResponse" } }
  }
);

router.post(
  "/api/dex/crossCurrencyPayment/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['DEX']
    // #swagger.summary = 'Cross Currency Payment'
    // #swagger.description = 'Performs a cross-currency payment on the XRP Ledger DEX.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/CrossCurrencyPaymentRequest" } } } }
    // #swagger.responses[200] = { description: 'CrossCurrencyPaymentResponse', schema: { $ref: "#/definitions/CrossCurrencyPaymentResponse" } }
  }
);

// ---------- TOKEN Endpoints ----------

router.post(
  "/api/token/tokenTransfer/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['Token']
    // #swagger.summary = 'Token Transfer'
    // #swagger.description = 'Transfers IOU/fungible tokens between accounts.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/TokenTransferRequest" } } } }
    // #swagger.responses[200] = { description: 'TokenTransferResponse', schema: { $ref: "#/definitions/TokenTransferResponse" } }
  }
);

router.post(
  "/api/token/burnToken/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['Token']
    // #swagger.summary = 'Burn Token'
    // #swagger.description = 'Burns IOU/fungible tokens.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/BurnTokenRequest" } } } }
    // #swagger.responses[200] = { description: 'BurnTokenResponse', schema: { $ref: "#/definitions/BurnTokenResponse" } }
  }
);

router.post(
  "/api/token/clawback/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['Token']
    // #swagger.summary = 'Clawback'
    // #swagger.description = 'Clawback IOU/fungible tokens from a holder.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/ClawbackRequest" } } } }
    // #swagger.responses[200] = { description: 'ClawbackResponse', schema: { $ref: "#/definitions/ClawbackResponse" } }
  }
);

router.post(
  "/api/token/freezeToken/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['Token']
    // #swagger.summary = 'Freeze Token'
    // #swagger.description = 'Freezes IOU/fungible tokens on an account.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/FreezeTokenRequest" } } } }
    // #swagger.responses[200] = { description: 'FreezeTokenResponse', schema: { $ref: "#/definitions/FreezeTokenResponse" } }
  }
);

router.post(
  "/api/token/trustSet/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['Token']
    // #swagger.summary = 'TrustSet'
    // #swagger.description = 'Creates or updates a trust line for IOU/fungible tokens.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/TrustSetRequest" } } } }
    // #swagger.responses[200] = { description: 'TrustSetResponse', schema: { $ref: "#/definitions/TrustSetResponse" } }
  }
);

router.post(
  "/api/token/accountSet/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['Token']
    // #swagger.summary = 'AccountSet'
    // #swagger.description = 'Account configuration operations.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/AccountSetRequest" } } } }
    // #swagger.responses[200] = { description: 'AccountSetResponse', schema: { $ref: "#/definitions/AccountSetResponse" } }
  }
);

router.post(
  "/api/token/xrpTransfer/:vaultAccountId",
  (req: Request, res: Response) => {
    // #swagger.tags = ['Token']
    // #swagger.summary = 'XRP Transfer'
    // #swagger.description = 'Transfers XRP from one account to another.'
    // #swagger.parameters['vaultAccountId'] = { description: 'Fireblocks vault account ID', required: true }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/definitions/XrpTransferRequest" } } } }
    // #swagger.responses[200] = { description: 'XrpTransferResponse', schema: { $ref: "#/definitions/XrpTransferResponse" } }
  }
);

// Don't export this router for real app, just for swagger-autogen to scan

export default router;
