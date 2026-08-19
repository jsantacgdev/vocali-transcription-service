import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { createRealtimeToken } from "@infrastructure/container";
import {
  jsonResponse,
  toHttpResponse,
} from "@infrastructure/lambda/http/errorMapper";

export const handler = async (
  _event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const result = await createRealtimeToken.execute();
    return jsonResponse(200, result);
  } catch (error) {
    return toHttpResponse(error);
  }
};
