// remove type imports from http for Deno compatibility
// see https://github.com/octokit/octokit.js/issues/24#issuecomment-817361886
// import { IncomingMessage, ServerResponse } from "http";
type IncomingMessage = any;
type ServerResponse = any;

import { parseRequest } from "./parse-request";
import { sendResponse } from "./send-response";
import { onUnhandledRequestDefault } from "../on-unhandled-request-default";
import { handleRequest } from "../handler";
import { OAuthApp } from "../../index";
import { HandlerOptions } from "../types";
import { ClientType, Options } from "../../types";

function onUnhandledRequestDefaultNode(
  request: IncomingMessage,
  response: ServerResponse
) {
  const generalRequest = parseRequest(request);
  const generalResponse = onUnhandledRequestDefault(generalRequest);
  sendResponse(generalResponse, response);
}

export function createNodeMiddleware(
  app: OAuthApp<Options<ClientType>>,
  {
    pathPrefix = "/api/github/oauth",
    onUnhandledRequest = onUnhandledRequestDefaultNode,
  }: HandlerOptions & {
    onUnhandledRequest?: (
      request: IncomingMessage,
      response: ServerResponse
    ) => void;
  } = {}
) {
  return async function (
    request: IncomingMessage,
    response: ServerResponse,
    next?: Function
  ) {
    const generalRequest = parseRequest(request);
    const generalResponse = await handleRequest(
      app,
      { pathPrefix },
      generalRequest
    );

    if (generalResponse) {
      sendResponse(generalResponse, response);
    } else if (typeof next === "function") {
      next();
    } else {
      onUnhandledRequest(request, response);
    }
  };
}
