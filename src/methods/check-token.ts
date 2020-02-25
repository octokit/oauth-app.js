import { request as defaultRequest } from "@octokit/request";

import { State } from "../types";

type Options = {
  clientId: string;
  clientSecret: string;
  token: string;
};

type StateOptions = {
  token: string;
};

async function sendCheckTokenRequest(
  request: typeof defaultRequest,
  options: Options
) {
  const { data } = await request("POST /applications/:client_id/token", {
    client_id: options.clientId,
    access_token: options.token
  });
  return data;
}

export async function checkToken(options: Options) {
  return sendCheckTokenRequest(defaultRequest, options);
}

export function checkTokenWithState(state: State, options: StateOptions) {
  return sendCheckTokenRequest(
    state.octokit.request,
    Object.assign(
      {
        clientId: state.clientId,
        clientSecret: state.clientSecret
      },
      options
    )
  );
}

export type AppCheckToken = (
  options: StateOptions
) => ReturnType<typeof checkTokenWithState>;
