import type { OctokitRequest } from "./types.js";

export function unknownRouteResponse(request: OctokitRequest) {
  return {
    status: 404,
    headers: { "content-type": "application/json" },
    text: JSON.stringify({
      error: `Unknown route: ${request.method} ${request.url}`,
    }),
  };
}
