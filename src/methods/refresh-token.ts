import * as OAuthMethods from "@octokit/oauth-methods";

import { State } from "../types";
import { emitEvent } from "../emit-event";
import { createOAuthUserAuth } from "@octokit/auth-oauth-user";

export type RefreshTokenOptions = {
  refreshToken: string;
};

export async function refreshTokenWithState(
  state: State,
  options: RefreshTokenOptions
): Promise<OAuthMethods.RefreshTokenResponse> {
  if (state.clientType === "oauth-app") {
    throw new Error(
      "[@octokit/oauth-app] app.refreshToken() is not supported for OAuth Apps"
    );
  }

  const response = await OAuthMethods.refreshToken({
    clientType: "github-app",
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    refreshToken: options.refreshToken,
  });

  await emitEvent(state, {
    name: "token",
    action: "refreshed",
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

export interface RefreshTokenInterface {
  (options: RefreshTokenOptions): Promise<OAuthMethods.RefreshTokenResponse>;
}
