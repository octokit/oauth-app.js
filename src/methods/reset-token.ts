import { request as defaultRequest } from "@octokit/request";
import btoa from "btoa-lite";

import { emitEvent } from "../emit-event";
import { State } from "../types";

type Options = {
  clientId: string;
  clientSecret: string;
  token: string;
};

type StateOptions = {
  token: string;
};

type RequestOptions = {
  client_id: string;
  access_token: string;
};

async function sendResetTokenRequest(
  request: typeof defaultRequest,
  options: RequestOptions
) {
  const { data } = await request(
    "PATCH /applications/:client_id/token",
    options
  );
  return data;
}

export function resetToken(options: Options) {
  const request = defaultRequest.defaults({
    headers: {
      authorization: `basic ${btoa(
        `${options.clientId}:${options.clientSecret}`
      )}`,
    },
  });

  return sendResetTokenRequest(request, {
    client_id: options.clientId,
    access_token: options.token,
  });
}

export async function resetTokenWithState(state: State, options: StateOptions) {
  const result = await sendResetTokenRequest(state.octokit.request, {
    client_id: state.clientId,
    access_token: options.token,
  });

  await emitEvent(state, {
    name: "token",
    action: "reset",
    token: result.token,
    scopes: result.scopes,
    get octokit() {
      return new state.Octokit({
        auth: result.token,
      });
    },
  });

  return result;
}

export type AppResetToken = (
  options: StateOptions
) => ReturnType<typeof resetTokenWithState>;
