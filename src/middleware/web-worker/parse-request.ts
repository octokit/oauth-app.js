import type { OctokitRequest } from "../types.js";

export function parseRequest(request: Request): OctokitRequest {
  // @ts-ignore Worker environment supports fromEntries/entries.
  const headers = Object.fromEntries(request.headers.entries());
  return {
    method: request.method,
    url: request.url,
    headers,
    text: () => request.text(),
  };
}
