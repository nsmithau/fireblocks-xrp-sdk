import { Request, Response, NextFunction } from "express";
import { ValidationError, SigningError } from "../errors/errors";

// Middleware to validate vault account ID
export const validateVaultAccount = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { vaultAccountId } = req.params;
  if (vaultAccountId === undefined || vaultAccountId === null) {
    res.status(400).json({
      error: "Missing vault account ID",
      message: "Vault account Id is missing from the request URL",
    });
    return;
  }
  next();
};

//middleware to handle errors
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: "ValidationError", message: err.message });
  } else if (err instanceof SigningError) {
    res.status(500).json({ error: "SigningError", message: err.message });
  } else {
    res.status(500).json({ error: "Unknown Error", message: err.message });
  }
};

/**
 * Middleware to check that req.body exists and is a valid object.
 */
export const requireBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new ValidationError(
      "InvalidBody",
      "Request body is required and must be a valid JSON object."
    );
  }
  next();
};
