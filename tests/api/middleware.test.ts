// tests/api/middleware.test.ts
import { Request, Response, NextFunction } from "express";
import {
  validateVaultAccount,
  requireBody,
  errorHandler,
} from "../../src/api/middleware";
import { ValidationError, SigningError } from "../../src/errors/errors";

describe("middleware", () => {
  describe("validateVaultAccount", () => {
    it("should call next() if vaultAccountId is present", () => {
      const req = { params: { vaultAccountId: "123" } } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      validateVaultAccount(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should return 400 if vaultAccountId is missing", () => {
      const req = { params: {} } as unknown as Request;
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { status } as unknown as Response;
      const next = jest.fn();

      validateVaultAccount(req, res, next);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        error: "Missing vault account ID",
        message: "Vault account Id is missing from the request URL",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireBody", () => {
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    it("should call next if req.body is a valid object", () => {
      const req = { body: { some: "value" } } as Request;

      requireBody(req, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it("should throw ValidationError if body is missing", () => {
      const req = { body: null } as Request;
      expect(() => requireBody(req, mockRes, mockNext)).toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError if body is an array", () => {
      const req = { body: [] } as unknown as Request;
      expect(() => requireBody(req, mockRes, mockNext)).toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError if body is not an object", () => {
      const req = { body: "invalid" } as unknown as Request;
      expect(() => requireBody(req, mockRes, mockNext)).toThrow(
        ValidationError
      );
    });
  });

  describe("errorHandler", () => {
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    it("should handle ValidationError with status 400", () => {
      const err = new ValidationError("TestCode", "Validation failed");
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "ValidationError",
        message: "Validation failed",
      });
    });

    it("should handle SigningError with status 500", () => {
      const err = new SigningError("SignError", "Signing failed");
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "SigningError",
        message: "Signing failed",
      });
    });

    it("should handle unknown errors with status 500", () => {
      const err = new Error("Unknown failure");
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unknown Error",
        message: "Unknown failure",
      });
    });
  });
});
