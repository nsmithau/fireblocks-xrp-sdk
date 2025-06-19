// tests/errors.test.ts
import {
  ValidationError,
  SigningError,
  ClientError,
} from "../../src/errors/errors";

describe("Custom SDK Error Classes", () => {
  it("ValidationError should set name, code, and message", () => {
    const error = new ValidationError("InvalidInput", "Bad input value");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe("ValidationError");
    expect(error.code).toBe("InvalidInput");
    expect(error.message).toBe("Bad input value");
  });

  it("SigningError should set name, code, and message", () => {
    const error = new SigningError("SignFail", "Failed to sign transaction");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SigningError);
    expect(error.name).toBe("SigningError");
    expect(error.code).toBe("SignFail");
    expect(error.message).toBe("Failed to sign transaction");
  });

  it("ClientError should set name, code, and message", () => {
    const error = new ClientError("XrpClient", "XRPL connection failed");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ClientError);
    expect(error.name).toBe("ClientError");
    expect(error.code).toBe("XrpClient");
    expect(error.message).toBe("XRPL connection failed");
  });

  it("should throw and catch ValidationError", () => {
    try {
      throw new ValidationError("TestCode", "Test message");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).code).toBe("TestCode");
    }
  });

  it("should throw and catch SigningError", () => {
    try {
      throw new SigningError("TestCode", "Test message");
    } catch (err) {
      expect(err).toBeInstanceOf(SigningError);
      expect((err as SigningError).code).toBe("TestCode");
    }
  });

  it("should throw and catch ClientError", () => {
    try {
      throw new ClientError("TestCode", "Test message");
    } catch (err) {
      expect(err).toBeInstanceOf(ClientError);
      expect((err as ClientError).code).toBe("TestCode");
    }
  });
});
