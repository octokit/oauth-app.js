import { request as defaultRequest } from "@octokit/request";
import btoa from "btoa-lite";

import { State } from "../types";

type Options = {
  clientId: string;
  clientSecret: string;
  token: string;
};

type StateOptions = {
  token: string;
};

type CheckTokenRequestOptions = {
  client_id: string;
  access_token: string;
};

async function sendCheckTokenRequest(
  request: typeof defaultRequest,
  options: CheckTokenRequestOptions
) {
  const { data } = await request(
    "POST /applications/:client_id/token",
    options
  );
  return data;
}

export async function checkToken(options: Options) {
  const request = defaultRequest.defaults({
    headers: {
      authorization: `basic ${btoa(
        `${options.clientId}:${options.clientSecret}`
      )}`
    }
  });

  return sendCheckTokenRequest(request, {
    client_id: options.clientId,
    access_token: options.token
  });
}

export function checkTokenWithState(state: State, options: StateOptions) {
  return sendCheckTokenRequest(state.octokit.request, {
    client_id: state.clientId,
    access_token: options.token
  });
}

export type AppCheckToken = (
  options: StateOptions
) => ReturnType<typeof checkTokenWithState>;
