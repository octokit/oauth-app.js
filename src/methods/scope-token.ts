import * as OAuthMethods from "@octokit/oauth-methods";
import { createOAuthUserAuth } from "@octokit/auth-oauth-user";

import type { State } from "../types";
import { emitEvent } from "../emit-event";

type StateOptions = "clientType" | "clientId" | "clientSecret" | "request";

export type ScopeTokenOptions = Omit<
  OAuthMethods.ScopeTokenOptions,
  StateOptions
>;

export async function scopeTokenWithState(
  state: State,
  options: ScopeTokenOptions,
): Promise<
  OAuthMethods.ScopeTokenResponse & {
    authentication: {
      type: "token";
      tokenType: "oauth";
    };
  }
> {
  if (state.clientType === "oauth-app") {
    throw new Error(
      "[@octokit/oauth-app] app.scopeToken() is not supported for OAuth Apps",
    );
  }

  const response = await OAuthMethods.scopeToken({
    clientType: "github-app",
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options,
  } as OAuthMethods.ScopeTokenOptions);

  const authentication = Object.assign(response.authentication, {
    type: "token" as const,
    tokenType: "oauth" as const,
  });
  await emitEvent(state, {
    name: "token",
    action: "scoped",
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

export interface ScopeTokenInterface {
  (options: ScopeTokenOptions): Promise<
    OAuthMethods.ScopeTokenResponse & {
      authentication: {
        type: "token";
        tokenType: "oauth";
      };
    }
  >;
}
