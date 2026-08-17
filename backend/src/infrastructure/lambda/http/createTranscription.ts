import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { createTranscription } from "../../container";
import { DomainError } from "../../../domain/errors";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub as string;
    const body = JSON.parse(event.body ?? "{}");

    if (!body.fileName || typeof body.contentLength !== "number") {
      return json(400, { message: "fileName and contentLength are required" });
    }

    const result = await createTranscription.execute({
      userId,
      fileName: body.fileName,
      contentLength: body.contentLength,
    });

    return json(201, result);
  } catch (error) {
    if (error instanceof DomainError) {
      return json(error.code === "FILE_TOO_LARGE" ? 413 : 400, {
        message: error.message,
      });
    }
    console.error(error);
    return json(500, { message: "Internal server error" });
  }
};

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
