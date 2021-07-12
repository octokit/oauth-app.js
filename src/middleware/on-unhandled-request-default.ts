import { GeneralRequest, GeneralResponse } from "./types";

export function onUnhandledRequestDefault(
  request: GeneralRequest
): GeneralResponse {
  return {
    status: 404,
    headers: { "content-type": "application/json" },
    text: JSON.stringify({
      error: `Unknown route: ${request.method} ${request.url}`,
    }),
  };
}
