import { parseRequest } from "./parse-request.js";
import { sendResponse } from "./send-response.js";
import { handleRequest } from "../handle-request.js";
import type { OAuthApp } from "../../index.js";
import type { HandlerOptions } from "../types.js";
import type { ClientType, Options } from "../../types.js";

export function createWebWorkerHandler<T extends Options<ClientType>>(
  app: OAuthApp<T>,
  options: HandlerOptions = {},
) {
  return async function (request: Request): Promise<Response | undefined> {
    const octokitRequest = await parseRequest(request);
    const octokitResponse = await handleRequest(app, options, octokitRequest);
    return octokitResponse ? sendResponse(octokitResponse) : undefined;
  };
}
