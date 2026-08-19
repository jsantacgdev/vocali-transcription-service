import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { downloadTranscription } from "@infrastructure/container";
import {
  jsonResponse,
  toHttpResponse,
} from "@infrastructure/lambda/http/errorMapper";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub as string;
    const transcriptionId = event.pathParameters?.id;

    if (!transcriptionId) {
      return jsonResponse(400, {
        code: "MISSING_PARAMETER",
        message: "transcriptionId is required",
      });
    }

    const result = await downloadTranscription.execute({
      userId,
      transcriptionId,
    });

    return jsonResponse(200, result);
  } catch (error) {
    return toHttpResponse(error);
  }
};
