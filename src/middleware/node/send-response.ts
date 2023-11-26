// remove type imports from http for Deno compatibility
// see https://github.com/octokit/octokit.js/issues/2075#issuecomment-817361886
// import { IncomingMessage, ServerResponse } from "node:http";
type ServerResponse = any;
import type { OctokitResponse } from "../types";

export function sendResponse(
  octokitResponse: OctokitResponse,
  response: ServerResponse,
) {
  response.writeHead(octokitResponse.status, octokitResponse.headers);
  response.end(octokitResponse.text);
}
