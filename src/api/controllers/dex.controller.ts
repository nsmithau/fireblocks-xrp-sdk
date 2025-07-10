import { Request, Response, NextFunction } from "express";
import { Logger } from "../../utils/logger";
import { FbksXrpApiService } from "../ApiService";
import { TransactionType } from "../../pool/types";

const logger = new Logger("dex-controller");

export const offerCreate = async (
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) => {
  try {
    logger.info("Creating OfferCreate Transaction, parameters:", req.body);
    const txRes = await api.executeTransaction({
      vaultAccountId: req.params.vaultAccountId,
      transactionType: TransactionType.OFFER_CREATE,
      params: req.body,
    });
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in Offer Create:", error);
    next(error);
  }
};

export const offerCancel = async (
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) => {
  try {
    logger.info("Creating OfferCancel Transaction");
    const txRes = await api.executeTransaction({
      vaultAccountId: req.params.vaultAccountId,
      transactionType: TransactionType.OFFER_CANCEL,
      params: req.body,
    });
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in OfferCancel:", error);
    next(error);
  }
};

export const crossCurrencyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) => {
  try {
    logger.info("Creating Cross Currency Payment Transaction");
    const txRes = await api.executeTransaction({
      vaultAccountId: req.params.vaultAccountId,
      transactionType: TransactionType.CROSS_CURRENCY_PAYMENT,
      params: req.body,
    });
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in Cross Currency Payment:", error);
    next(error);
  }
};
