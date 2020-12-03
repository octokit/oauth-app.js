import { createOAuthAppAuth } from "@octokit/auth-oauth-app";
import { createUnauthenticatedAuth } from "@octokit/auth-unauthenticated";
import { request as defaultRequest } from "@octokit/request";

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

async function sendDeleteAuthorizationRequest(
  request: typeof defaultRequest,
  options: RequestOptions
) {
  const { data } = await request(
    "DELETE /applications/{client_id}/grant",
    options
  );
  return data;
}

export function deleteAuthorization(options: Options) {
  const request = defaultRequest.defaults({
    request: {
      hook: createOAuthAppAuth({
        clientId: options.clientId,
        clientSecret: options.clientSecret,
      }).hook,
    },
  });

  return sendDeleteAuthorizationRequest(request, {
    client_id: options.clientId,
    access_token: options.token,
  });
}

export async function deleteAuthorizationWithState(
  state: State,
  options: StateOptions
) {
  await emitEvent(state, {
    name: "authorization",
    action: "before_deleted",
    token: options.token,
    get octokit() {
      return new state.Octokit({ auth: options.token });
    },
  });

  await emitEvent(state, {
    name: "token",
    action: "before_deleted",
    token: options.token,
    get octokit() {
      return new state.Octokit({ auth: options.token });
    },
  });

  const result = await sendDeleteAuthorizationRequest(state.octokit.request, {
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

  await emitEvent(state, {
    name: "authorization",
    action: "deleted",
    token: options.token,
    get octokit() {
      return new state.Octokit({
        authStrategy: createUnauthenticatedAuth,
        auth: {
          reason: `Handling "authorization.deleted" event. The access for the app has been revoked.`,
        },
      });
    },
  });

  return result;
}

export type AppDeleteAuthorization = (
  options: StateOptions
) => ReturnType<typeof deleteAuthorizationWithState>;
