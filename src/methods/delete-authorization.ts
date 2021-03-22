import * as OAuthMethods from "@octokit/oauth-methods";
import { createUnauthenticatedAuth } from "@octokit/auth-unauthenticated";

import { State } from "../types";
import { emitEvent } from "../emit-event";

export type DeleteAuthorizationOptions = {
  token: string;
};

export async function deleteAuthorizationWithState(
  state: State,
  options: DeleteAuthorizationOptions
): Promise<OAuthMethods.DeleteAuthorizationResponse> {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options,
  };

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

  const response =
    state.clientType === "oauth-app"
      ? await OAuthMethods.deleteAuthorization({
          clientType: "oauth-app",
          ...optionsWithDefaults,
        })
      : await OAuthMethods.deleteAuthorization({
          clientType: "github-app",
          ...optionsWithDefaults,
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

  return response;
}

export interface DeleteAuthorizationInterface {
  (
    options: DeleteAuthorizationOptions
  ): Promise<OAuthMethods.DeleteAuthorizationResponse>;
}
