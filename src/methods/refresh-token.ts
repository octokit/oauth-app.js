import * as OAuthMethods from "@octokit/oauth-methods";

import type { State } from "../types.js";
import { emitEvent } from "../emit-event.js";
import { createOAuthUserAuth } from "@octokit/auth-oauth-user";

export type RefreshTokenOptions = {
  refreshToken: string;
};

export async function refreshTokenWithState(
  state: State,
  options: RefreshTokenOptions,
): Promise<
  OAuthMethods.RefreshTokenResponse & {
    authentication: {
      type: "token";
      tokenType: "oauth";
    };
  }
> {
  if (state.clientType === "oauth-app") {
    throw new Error(
      "[@octokit/oauth-app] app.refreshToken() is not supported for OAuth Apps",
    );
  }

  const response = await OAuthMethods.refreshToken({
    clientType: "github-app",
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    refreshToken: options.refreshToken,
  });

  const authentication = Object.assign(response.authentication, {
    type: "token" as const,
    tokenType: "oauth" as const,
  });

  await emitEvent(state, {
    name: "token",
    action: "refreshed",
    token: response.authentication.token,
    authentication: authentication,
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

  return { ...response, authentication };
}

export interface RefreshTokenInterface {
  (options: RefreshTokenOptions): Promise<
    OAuthMethods.RefreshTokenResponse & {
      authentication: {
        type: "token";
        tokenType: "oauth";
      };
    }
  >;
}
