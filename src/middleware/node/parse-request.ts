// remove type imports from http for Deno compatibility
// see https://github.com/octokit/octokit.js/issues/2075#issuecomment-817361886
// import { IncomingMessage } from "http";
type IncomingMessage = any;

import type { OctokitRequest } from "../types";

export function parseRequest(request: IncomingMessage): OctokitRequest {
  const { method, url, headers } = request;
  async function text() {
    const text = await new Promise<string>((resolve, reject) => {
      let bodyChunks: Uint8Array[] = [];
      request
        .on("error", reject)
        .on("data", (chunk: Uint8Array) => bodyChunks.push(chunk))
        .on("end", () => resolve(Buffer.concat(bodyChunks).toString()));
    });
    return text;
  }
  return { method, url, headers, text };
}
