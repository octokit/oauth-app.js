import type { OctokitRequest } from "../types.js";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

export function parseRequest(request: APIGatewayProxyEventV2): OctokitRequest {
  const { method } = request.requestContext.http;
  let url = request.rawPath;
  const { stage } = request.requestContext;
  if (url.startsWith("/" + stage)) url = url.substring(stage.length + 1);
  if (request.rawQueryString) url += "?" + request.rawQueryString;
  const headers = request.headers as Record<string, string>;
  const text = async () => request.body || "";
  return { method, url, headers, text };
}
