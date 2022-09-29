// remove type imports from http for Deno compatibility
// see https://github.com/octokit/octokit.js/issues/2075#issuecomment-817361886
// import { IncomingMessage, ServerResponse } from "http";
type IncomingMessage = any;
type ServerResponse = any;

import { parseRequest } from "./parse-request";
import { sendResponse } from "./send-response";
import { onUnhandledRequestDefault } from "../on-unhandled-request-default";
import { handleRequest } from "../handle-request";
import { OAuthApp } from "../../index";
import { HandlerOptions } from "../types";
import { ClientType, Options } from "../../types";

function onUnhandledRequestDefaultNode(
  request: IncomingMessage,
  response: ServerResponse
) {
  const octokitRequest = parseRequest(request);
  const octokitResponse = onUnhandledRequestDefault(octokitRequest);
  sendResponse(octokitResponse, response);
}

export function createNodeMiddleware(
  app: OAuthApp<Options<ClientType>>,
  {
    pathPrefix,
    onUnhandledRequest,
  }: HandlerOptions & {
    onUnhandledRequest?: (
      request: IncomingMessage,
      response: ServerResponse
    ) => void;
  } = {}
) {
  if (onUnhandledRequest) {
    app.octokit.log.warn(
      "[@octokit/oauth-app] `onUnhandledRequest` is deprecated and will be removed from the next major version."
    );
  }
  onUnhandledRequest ??= onUnhandledRequestDefaultNode;
  return async function (
    request: IncomingMessage,
    response: ServerResponse,
    next?: Function
  ) {
    const octokitRequest = parseRequest(request);
    const octokitResponse = await handleRequest(
      app,
      { pathPrefix },
      octokitRequest
    );

    if (octokitResponse) {
      sendResponse(octokitResponse, response);
    } else if (typeof next === "function") {
      next();
    } else {
      onUnhandledRequest!(request, response);
    }
  };
}
