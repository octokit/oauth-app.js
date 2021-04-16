// remove type imports from http for Deno compatibility
// see https://github.com/octokit/octokit.js/issues/24#issuecomment-817361886
// import { IncomingMessage } from "http";
type IncomingMessage = any;

// @ts-ignore remove once Node 10 is out maintenance. Replace with Object.fromEntries
import fromEntries from "fromentries";

type ParsedRequest = {
  headers: {
    authorization?: string;
  };
  query: {
    state?: string;
    scopes?: string;
    code?: string;
    redirectUrl?: string;
    allowSignup?: boolean;
    error?: string;
    error_description?: string;
    error_url?: string;
  };
  body?: {
    code?: string;
    state?: string;
    redirectUrl?: string;
    refreshToken?: string;
  };
};

export async function parseRequest(
  request: IncomingMessage
): Promise<ParsedRequest> {
  const { searchParams } = new URL(request.url as string, "http://localhost");

  const query = fromEntries(searchParams);
  const headers = request.headers;

  if (!["POST", "PATCH"].includes(request.method as string)) {
    return { headers, query };
  }

  return new Promise((resolve, reject) => {
    let bodyChunks: Uint8Array[] = [];
    request
      .on("error", reject)
      .on("data", (chunk: any) => bodyChunks.push(chunk))
      .on("end", async () => {
        const bodyString = Buffer.concat(bodyChunks).toString();
        if (!bodyString) return resolve({ headers, query });

        try {
          resolve({ headers, query, body: JSON.parse(bodyString) });
        } catch (error) {
          reject(error);
        }
      });
  });
}
