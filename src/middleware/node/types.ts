import { IncomingMessage, ServerResponse } from "http";

export type MiddlewareOptions = {
  pathPrefix?: string;
  onUnhandledRequest?: (
    request: IncomingMessage,
    response: ServerResponse
  ) => void;
};
