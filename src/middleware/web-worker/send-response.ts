import type { OctokitResponse } from "../types.js";

export function sendResponse(octokitResponse: OctokitResponse): Response {
  const responseOptions = {
    status: octokitResponse.status,
  };

  if (octokitResponse.headers) {
    Object.assign(responseOptions, { headers: octokitResponse.headers });
  }

  return new Response(octokitResponse.text, responseOptions);
}
