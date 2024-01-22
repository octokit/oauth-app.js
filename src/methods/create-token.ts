import * as OAuthAppAuth from "@octokit/auth-oauth-app";

import type {
  ClientType,
  GithubAppUserAuthenticationWithOptionalExpiration,
  State,
} from "../types.js";
import { emitEvent } from "../emit-event.js";

export type CreateTokenWebFlowOptions = Omit<
  OAuthAppAuth.WebFlowAuthOptions,
  "type"
>;
export type CreateTokenOAuthAppDeviceFlowOptions = Omit<
  OAuthAppAuth.OAuthAppDeviceFlowAuthOptions,
  "type"
>;
export type CreateTokenGitHubAppDeviceFlowOptions = Omit<
  OAuthAppAuth.GitHubAppDeviceFlowAuthOptions,
  "type"
>;

export async function createTokenWithState(
  state: State,
  options:
    | CreateTokenWebFlowOptions
    | CreateTokenOAuthAppDeviceFlowOptions
    | CreateTokenGitHubAppDeviceFlowOptions,
): Promise<{
  authentication:
    | OAuthAppAuth.OAuthAppUserAuthentication
    | OAuthAppAuth.GitHubAppUserAuthentication
    | OAuthAppAuth.GitHubAppUserAuthenticationWithExpiration;
}> {
  const authentication: any = await state.octokit.auth({
    type: "oauth-user",
    ...options,
  });

  await emitEvent(state, {
    name: "token",
    action: "created",
    token: authentication.token,
    scopes: authentication.scopes,
    authentication,
    octokit: new state.Octokit({
      authStrategy: OAuthAppAuth.createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: authentication.token,
        scopes: authentication.scopes,
        refreshToken: authentication.refreshToken,
        expiresAt: authentication.expiresAt,
        refreshTokenExpiresAt: authentication.refreshTokenExpiresAt,
      },
    }),
  });

  return { authentication };
}

export interface CreateTokenInterface<TClientType extends ClientType> {
  // web flow
  (options: CreateTokenWebFlowOptions): TClientType extends "oauth-app"
    ? Promise<{ authentication: OAuthAppAuth.OAuthAppUserAuthentication }>
    : Promise<{
        authentication: GithubAppUserAuthenticationWithOptionalExpiration;
      }>;

  // device flow
  (
    options: TClientType extends "oauth-app"
      ? CreateTokenOAuthAppDeviceFlowOptions
      : CreateTokenGitHubAppDeviceFlowOptions,
  ): TClientType extends "oauth-app"
    ? Promise<{ authentication: OAuthAppAuth.OAuthAppUserAuthentication }>
    : Promise<{
        authentication: GithubAppUserAuthenticationWithOptionalExpiration;
      }>;
}
