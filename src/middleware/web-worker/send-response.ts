import type { OctokitResponse } from "../types.js";

export function sendResponse(octokitResponse: OctokitResponse): Response {
  return new Response(octokitResponse.text, {
    status: octokitResponse.status,
    headers: octokitResponse.headers,
  });
}
