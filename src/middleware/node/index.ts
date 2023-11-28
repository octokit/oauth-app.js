// remove type imports from http for Deno compatibility
// see https://github.com/octokit/octokit.js/issues/2075#issuecomment-817361886
// import { IncomingMessage, ServerResponse } from "node:http";
type IncomingMessage = any;
type ServerResponse = any;

import { parseRequest } from "./parse-request.js";
import { sendResponse } from "./send-response.js";
import { handleRequest } from "../handle-request.js";
import type { OAuthApp } from "../../index.js";
import type { HandlerOptions } from "../types.js";
import type { ClientType, Options } from "../../types.js";

export function createNodeMiddleware(
  app: OAuthApp<Options<ClientType>>,
  options: HandlerOptions = {},
) {
  return async function (
    request: IncomingMessage,
    response: ServerResponse,
    next?: Function,
  ) {
    const octokitRequest = await parseRequest(request);
    const octokitResponse = await handleRequest(app, options, octokitRequest);
    if (octokitResponse) {
      sendResponse(octokitResponse, response);
      return true;
    } else {
      next?.();
      return false;
    }
  };
}
