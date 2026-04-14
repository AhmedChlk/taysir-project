export const ErrorCodes = {
  ERR_UNAUTHORIZED: "AUTH_REQUIRED",
  ERR_FORBIDDEN: "FORBIDDEN_ACCESS",
  ERR_INVALID_DATA: "INVALID_DATA_FORMAT",
  ERR_TENANT_MISMATCH: "TENANT_DATA_ISOLATION_VIOLATION",
  ERR_NOT_FOUND: "RESOURCE_NOT_FOUND",
  ERR_INTERNAL_SERVER: "INTERNAL_SERVER_ERROR",
  ERR_DATABASE_FAILURE: "DATABASE_OPERATION_FAILED",
} as const;

export type TaysirErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class TaysirError extends Error {
  public code: TaysirErrorCode;
  public status: number;
  public details?: unknown;

  constructor(message: string, code: TaysirErrorCode, status: number = 400, details?: unknown) {
    super(message);
    this.name = "TaysirError";
    this.code = code;
    this.status = status;
    this.details = details;

    Object.setPrototypeOf(this, TaysirError.prototype);
  }

  toJSON() {
    return {
      error: true,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}
