import { parseRequest } from "./api-gateway-v2-parse-request";
import { sendResponse } from "./api-gateway-v2-send-response";
import { handleRequest } from "../handle-request";
import { onUnhandledRequestDefault } from "../on-unhandled-request-default";
import type { HandlerOptions } from "../types";
import { OAuthApp } from "../../index";
import type { ClientType, Options } from "../../types";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

async function onUnhandledRequestDefaultAWSAPIGatewayV2(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
  const request = parseRequest(event);
  const response = onUnhandledRequestDefault(request);
  return sendResponse(response);
}

export function createAWSLambdaAPIGatewayV2Handler(
  app: OAuthApp<Options<ClientType>>,
  {
    pathPrefix,
    onUnhandledRequest,
  }: HandlerOptions & {
    onUnhandledRequest?: (
      event: APIGatewayProxyEventV2
    ) => Promise<APIGatewayProxyStructuredResultV2>;
  } = {}
) {
  if (onUnhandledRequest) {
    app.octokit.log.warn(
      "[@octokit/oauth-app] `onUnhandledRequest` is deprecated and will be removed from the next major version."
    );
  }
  onUnhandledRequest ??= onUnhandledRequestDefaultAWSAPIGatewayV2;
  return async function (event: APIGatewayProxyEventV2) {
    const request = parseRequest(event);
    const response = await handleRequest(app, { pathPrefix }, request);
    return response ? sendResponse(response) : onUnhandledRequest!(event);
  };
}
