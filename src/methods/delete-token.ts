import { request as defaultRequest } from "@octokit/request";
import { createUnauthenticatedAuth } from "@octokit/auth-unauthenticated";
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

async function sendDeleteTokenRequest(
  request: typeof defaultRequest,
  options: RequestOptions
) {
  const { data } = await request(
    "DELETE /applications/:client_id/token",
    options
  );
  return data;
}

export function deleteToken(options: Options) {
  const request = defaultRequest.defaults({
    headers: {
      authorization: `basic ${btoa(
        `${options.clientId}:${options.clientSecret}`
      )}`,
    },
  });

  return sendDeleteTokenRequest(request, {
    client_id: options.clientId,
    access_token: options.token,
  });
}

export async function deleteTokenWithState(
  state: State,
  options: StateOptions
) {
  await emitEvent(state, {
    name: "token",
    action: "before_deleted",
    token: options.token,
    get octokit() {
      return new state.Octokit({ auth: options.token });
    },
  });

  const result = await sendDeleteTokenRequest(state.octokit.request, {
    client_id: state.clientId,
    access_token: options.token,
  });

  await emitEvent(state, {
    name: "token",
    action: "deleted",
    token: options.token,
    get octokit() {
      return new state.Octokit({
        authStrategy: createUnauthenticatedAuth,
        auth: {
          reason: `Handling "token.deleted" event. The access for the token has been revoked.`,
        },
      });
    },
  });

  return result;
}

export type AppDeleteToken = (
  options: StateOptions
) => ReturnType<typeof deleteTokenWithState>;
