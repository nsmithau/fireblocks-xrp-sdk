import { Router, Request, Response, NextFunction } from "express";
import * as controllers from "../controllers";
import { FbksXrpApiService } from "../ApiService";
import { validateVaultAccount, requireBody } from "../middleware";
import { Logger } from "../../utils/logger";
import path from "path";

const logger = new Logger("dex-routes");

export const configureDexRoutes = (api: FbksXrpApiService): Router => {
  const router = Router();

  const dexRoutes = [
    { path: "offerCreate", handler: controllers.offerCreate },
    { path: "offerCancel", handler: controllers.offerCancel },
    { path: "crossCurrencyPayment", handler: controllers.crossCurrencyPayment },
    { path: "credentialCreate", handler: controllers.credentialCreate },
    { path: "credentialAccept", handler: controllers.credentialAccept },
    { path: "credentialDelete", handler: controllers.credentialDelete },
  ];

  for (const { path, handler } of dexRoutes) {
    router.post(
      `/api/dex/${path}/:vaultAccountId`,
      validateVaultAccount,
      requireBody,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await handler(req, res, next, api);
        } catch (error: any) {
          logger.error(`Error in ${path} request:`, error);
          next(error);
        }
      }
    );
    router.post(`/api/dex/${path}`, (req: Request, res: Response) => {
      logger.error(`Missing vault account ID for ${path} request`);
      res.status(400).json({
        error: "Missing vault account ID",
        message: "Vault account Id is missing from the request URL",
      });
    });
  }

  return router;
};
