import { GeneralResponse } from "../types";

export function sendResponse(generalResponse: GeneralResponse): Response {
  return new Response(generalResponse.text, {
    status: generalResponse.status,
    headers: generalResponse.headers,
  });
}
