import * as OAuthMethods from "@octokit/oauth-methods";

import { ClientType, State } from "../types";
import { emitEvent } from "../emit-event";
import { createOAuthUserAuth } from "@octokit/auth-oauth-user";

export type ResetTokenOptions = {
  token: string;
};

export async function resetTokenWithState(
  state: State,
  options: ResetTokenOptions
): Promise<
  | OAuthMethods.ResetTokenOAuthAppResponse
  | OAuthMethods.ResetTokenGitHubAppResponse
> {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options,
  };

  if (state.clientType === "oauth-app") {
    const response = await OAuthMethods.resetToken({
      clientType: "oauth-app",
      ...optionsWithDefaults,
    });

    await emitEvent(state, {
      name: "token",
      action: "reset",
      token: response.authentication.token,
      scopes: response.authentication.scopes || undefined,
      authentication: {
        type: "token",
        tokenType: "oauth",
        ...response.authentication,
      },
      octokit: new state.Octokit({
        authStrategy: createOAuthUserAuth,
        auth: {
          clientType: state.clientType,
          clientId: state.clientId,
          clientSecret: state.clientSecret,
          token: response.authentication.token,
          scopes: response.authentication.scopes,
        },
      }),
    });

    return response;
  }

  const response = await OAuthMethods.resetToken({
    clientType: "github-app",
    ...optionsWithDefaults,
  });

  await emitEvent(state, {
    name: "token",
    action: "reset",
    token: response.authentication.token,
    authentication: {
      type: "token",
      tokenType: "oauth",
      ...response.authentication,
    },
    octokit: new state.Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: response.authentication.token,
      },
    }),
  });

  return response;
}

export interface ResetTokenInterface<TClientType extends ClientType> {
  (options: ResetTokenOptions): TClientType extends "oauth-app"
    ? Promise<OAuthMethods.ResetTokenOAuthAppResponse>
    : Promise<OAuthMethods.ResetTokenGitHubAppResponse>;
}
