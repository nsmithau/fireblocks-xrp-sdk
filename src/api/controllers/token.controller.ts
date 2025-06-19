import { Request, Response, NextFunction } from "express";
import { Logger } from "../../utils/logger";
import { FbksXrpApiService } from "../ApiService";
import { TransactionType } from "../../pool/types";

const logger = new Logger("token-controller");

export async function tokenTransfer(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating Token Transfer Transaction");
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.TOKEN_TRANSFER,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in Token Transfer:", error);
    next(error);
  }
}

export async function accountSet(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating AccountSet Transaction");
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.ACCOUNT_SET,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in AccountSet:", error);
    next(error);
  }
}

export async function burnToken(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating a Burn Token Transaction");
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.BURN_TOKEN,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in burnToken:", error);
    next(error);
  }
}

export async function clawback(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating Clawback Transaction");
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.CLAWBACK,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in Clawback:", error);
    next(error);
  }
}

export async function freezeToken(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating a Freeze Token Transaction");
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.FREEZE_TOKEN,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in freezeToken:", error);
    next(error);
  }
}

export async function trustSet(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating a Trust Set Transaction");
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.TRUST_SET,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in trustSet:", error);
    next(error);
  }
}

export async function xrpTransfer(
  req: Request,
  res: Response,
  next: NextFunction,
  api: FbksXrpApiService
) {
  try {
    logger.info("Creating an XRP Transfer Transaction");
    const txRes = await api.executeTransaction(
      req.params.vaultAccountId,
      TransactionType.XRP_TRANSFER,
      req.body
    );
    res.status(200).json(txRes);
  } catch (error) {
    logger.error("Error in xrpTransfer:", error);
    next(error);
  }
}
