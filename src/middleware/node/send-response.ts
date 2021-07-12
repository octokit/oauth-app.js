// remove type imports from http for Deno compatibility
// see https://github.com/octokit/octokit.js/issues/2075#issuecomment-817361886
// import { IncomingMessage, ServerResponse } from "http";
type ServerResponse = any;
import { OctokitResponse } from "../types";

export function sendResponse(
  generalResponse: OctokitResponse,
  response: ServerResponse
) {
  response.writeHead(generalResponse.status, generalResponse.headers);
  response.end(generalResponse.text);
}
