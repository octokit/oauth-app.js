import { GeneralRequest } from "../types";

export function parseRequest(request: Request): GeneralRequest {
  const headers = Object.fromEntries(request.headers.entries());
  return {
    method: request.method,
    url: request.url,
    headers,
    text: () => request.text(),
  };
}
