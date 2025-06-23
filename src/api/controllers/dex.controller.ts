import { Request, Response, NextFunction } from "express";
import { Logger } from "../../utils/logger";
import { FbksXrpApiService } from "../ApiService";
import { TransactionType } from "../../pool/types";

const logger = new Logger("dex-controller");

export async function offerCreate(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating OfferCreate Transaction, parameters:", req.body);
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.OFFER_CREATE,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in Offer Create:", error);
    next(error);
  }
}

export async function offerCancel(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating OfferCancel Transaction");
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.OFFER_CANCEL,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in OfferCancel:", error);
    next(error);
  }
}

export async function crossCurrencyPayment(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating Cross Currency Payment Transaction");
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.CROSS_CURRENCY_PAYMENT,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in Cross Currency Payment:", error);
    next(error);
  }
}
