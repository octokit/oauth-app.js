import { parseRequest } from "./parse-request";
import { sendResponse } from "./send-response";
import { handleRequest } from "../handle-request";
import { onUnhandledRequestDefault } from "../on-unhandled-request-default";
import { OAuthApp } from "../../index";
import { ClientType } from "../../types";

type WorkerEnv = {
  readonly CLIENT_TYPE?: ClientType;
  readonly CLIENT_ID: string;
  readonly CLIENT_SECRET: string;
  readonly PATH_PREFIX?: string;
};

export default {
  fetch: async function (request: Request, env: WorkerEnv) {
    const app = new OAuthApp({
      clientType: env.CLIENT_TYPE,
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
    });
    const pathPrefix = env.PATH_PREFIX;
    const generalRequest = parseRequest(request);
    const generalResponse =
      (await handleRequest(app, { pathPrefix }, generalRequest)) ||
      onUnhandledRequestDefault(generalRequest);
    return sendResponse(generalResponse);
  },
};
