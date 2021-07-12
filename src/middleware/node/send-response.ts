// remove type imports from http for Deno compatibility
// see https://github.com/octokit/octokit.js/issues/24#issuecomment-817361886
// import { IncomingMessage, ServerResponse } from "http";
type ServerResponse = any;
import { GeneralResponse } from "../types";

export function sendResponse(
  generalResponse: GeneralResponse,
  response: ServerResponse
) {
  response.writeHead(generalResponse.status, generalResponse.headers);
  response.end(generalResponse.text);
}
