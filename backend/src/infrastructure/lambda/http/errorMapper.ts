import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { DomainError } from "@domain/errors";

const STATUS_BY_CODE: Record<string, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  NOT_READY: 409,
  FILE_TOO_LARGE: 413,
  INVALID_TRANSITION: 409,
};

export const jsonResponse = (
  statusCode: number,
  body: unknown,
): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const toHttpResponse = (error: unknown): APIGatewayProxyResultV2 => {
  if (error instanceof DomainError) {
    const statusCode = STATUS_BY_CODE[error.code] ?? 400;
    return jsonResponse(statusCode, {
      code: error.code,
      message: error.message,
    });
  }

  console.error(error);
  return jsonResponse(500, {
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  });
};
