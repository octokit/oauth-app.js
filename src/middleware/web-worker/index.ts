import { parseRequest } from "./parse-request";
import { sendResponse } from "./send-response";
import { handleRequest } from "../handle-request";
import type { OAuthApp } from "../../index";
import type { HandlerOptions } from "../types";
import type { ClientType, Options } from "../../types";

export function createWebWorkerHandler<T extends Options<ClientType>>(
  app: OAuthApp<T>,
  options: HandlerOptions = {}
) {
  return async function (request: Request): Promise<Response | undefined> {
    const octokitRequest = await parseRequest(request);
    const octokitResponse = await handleRequest(app, options, octokitRequest);
    return octokitResponse ? sendResponse(octokitResponse) : undefined;
  };
}
