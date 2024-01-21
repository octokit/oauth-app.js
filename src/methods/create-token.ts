import * as OAuthAppAuth from "@octokit/auth-oauth-app";

import type {
  ClientType,
  Options,
  RefreshTokenFromOptions,
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

export interface CreateTokenInterface<TOptions extends Options<ClientType>> {
  "oauth-app": OauthAppCreateTokenInterface;
  "github-app": GithubAppCreateTokenInterface<TOptions>;
}

interface OauthAppCreateTokenInterface {
  // web flow
  (
    options: CreateTokenWebFlowOptions,
  ): Promise<{ authentication: OAuthAppAuth.OAuthAppUserAuthentication }>;
  // device flow
  (
    options: CreateTokenOAuthAppDeviceFlowOptions,
  ): Promise<{ authentication: OAuthAppAuth.OAuthAppUserAuthentication }>;
}

export interface GithubAppCreateTokenInterface<
  TOptions extends Options<ClientType>,
> {
  // web flow
  (
    options: CreateTokenWebFlowOptions,
  ): RefreshTokenFromOptions<TOptions> extends "opt-in"
    ? Promise<{
        authentication: OAuthAppAuth.GitHubAppUserAuthenticationWithExpiration;
      }>
    : Promise<
        | {
            authentication: OAuthAppAuth.GitHubAppUserAuthentication;
          }
        | {
            authentication: OAuthAppAuth.GitHubAppUserAuthenticationWithExpiration;
          }
      >;

  // device flow
  (
    options: CreateTokenGitHubAppDeviceFlowOptions,
  ): RefreshTokenFromOptions<TOptions> extends "opt-in"
    ? Promise<{
        authentication: OAuthAppAuth.GitHubAppUserAuthenticationWithExpiration;
      }>
    : Promise<
        | {
            authentication: OAuthAppAuth.GitHubAppUserAuthentication;
          }
        | {
            authentication: OAuthAppAuth.GitHubAppUserAuthenticationWithExpiration;
          }
      >;
}
