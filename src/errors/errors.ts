export class ValidationError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
  }
}

export class SigningError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "SigningError";
    this.code = code;
  }
}

export class ClientError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ClientError";
    this.code = code;
  }
}
