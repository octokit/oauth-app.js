import { OAuthApp } from "../../index";
import { middleware } from "./middleware";

import { MiddlewareOptions } from "./types";
import { onUnhandledRequestDefault } from "./on-unhandled-request-default";
import { ClientType, Options } from "../../types";

export function createNodeMiddleware(
  app: OAuthApp<Options<ClientType>>,
  {
    pathPrefix = "/api/github/oauth",
    onUnhandledRequest = onUnhandledRequestDefault,
  }: MiddlewareOptions = {}
) {
  return middleware.bind(null, app, {
    pathPrefix,
    onUnhandledRequest,
  } as Required<MiddlewareOptions>);
}
