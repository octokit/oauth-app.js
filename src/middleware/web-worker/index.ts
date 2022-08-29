import { parseRequest } from "./parse-request";
import { sendResponse } from "./send-response";
import { handleRequest } from "../handle-request";
import { onUnhandledRequestDefault } from "../on-unhandled-request-default";
import { OAuthApp } from "../../index";
import { HandlerOptions } from "../types";
import { ClientType, Options } from "../../types";

async function onUnhandledRequestDefaultWebWorker(
  request: Request
): Promise<Response> {
  const octokitRequest = parseRequest(request);
  const octokitResponse = onUnhandledRequestDefault(octokitRequest);
  return sendResponse(octokitResponse);
}

export function createWebWorkerHandler<T extends Options<ClientType>>(
  app: OAuthApp<T>,
  {
    pathPrefix,
    onUnhandledRequest = onUnhandledRequestDefaultWebWorker,
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

/** @deprecated */
export function createCloudflareHandler<T>(
  ...args: Parameters<typeof createWebWorkerHandler>
) {
  args[0].octokit.log.warn(
    "[@octokit/oauth-app] `createCloudflareHandler` is deprecated, use `createWebWorkerHandler` instead"
  );
  return createWebWorkerHandler(...args);
}
