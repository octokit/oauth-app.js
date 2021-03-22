import * as OAuthMethods from "@octokit/oauth-methods";

import { State } from "../types";
import { emitEvent } from "../emit-event";

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
      get octokit() {
        return new state.Octokit({
          auth: response.authentication.token,
        });
      },
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
    get octokit() {
      return new state.Octokit({
        auth: response.authentication.token,
      });
    },
  });

  return response;
}

export interface ResetTokenInterface {
  (options: ResetTokenOptions): Promise<
    | OAuthMethods.ResetTokenOAuthAppResponse
    | OAuthMethods.ResetTokenGitHubAppResponse
  >;
}
