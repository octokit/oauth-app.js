import { parseRequest } from "./parse-request";
import { sendResponse } from "./send-response";
import { handleRequest } from "../handle-request";
import { onUnhandledRequestDefault } from "../on-unhandled-request-default";
import { OAuthApp } from "../../index";
import { HandlerOptions } from "../types";

async function onUnhandledRequestDefaultCloudflare(
  request: Request
): Promise<Response> {
  const octokitRequest = parseRequest(request);
  const octokitResponse = onUnhandledRequestDefault(octokitRequest);
  return sendResponse(octokitResponse);
}

export function createCloudflareHandler(
  app: OAuthApp,
  {
    pathPrefix,
    onUnhandledRequest = onUnhandledRequestDefaultCloudflare,
  }: HandlerOptions & {
    onUnhandledRequest?: (request: Request) => Response | Promise<Response>;
  } = {}
) {
  return async function (request: Request): Promise<Response> {
    const octokitRequest = parseRequest(request);
    const octokitResponse = await handleRequest(
      app,
      { pathPrefix },
      octokitRequest
    );
    return octokitResponse
      ? sendResponse(octokitResponse)
      : await onUnhandledRequest(request);
  };
}
