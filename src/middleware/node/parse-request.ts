import { IncomingMessage } from "http";

// @ts-ignore remove once Node 10 is out maintenance. Replace with Object.fromEntries
import fromEntries from "fromentries";

type ParsedRequest = {
  route: string;
  headers: {
    authorization?: string;
  };
  query: {
    state?: string;
    scopes?: string;
    code?: string;
    redirectUrl?: string;
  };
  body?: {
    code?: string;
    state?: string;
    redirectUrl?: string;
  };
};

export async function parseRequest(
  request: IncomingMessage
): Promise<ParsedRequest> {
  const { pathname, searchParams } = new URL(
    request.url as string,
    "http://localhost"
  );
  const route = [request.method, pathname].join(" ");

  const query = fromEntries(searchParams);
  const headers = request.headers;

  if (!["POST", "PATCH"].includes(request.method as string)) {
    return { route, headers, query };
  }

  return new Promise((resolve, reject) => {
    let bodyChunks: Uint8Array[] = [];
    request
      .on("error", reject)
      .on("data", chunk => bodyChunks.push(chunk))
      .on("end", async () => {
        const bodyString = Buffer.concat(bodyChunks).toString();
        if (!bodyString) return resolve({ route, headers, query });

        try {
          resolve({ route, headers, query, body: JSON.parse(bodyString) });
        } catch (error) {
          reject(error);
        }
      });
  });
}
