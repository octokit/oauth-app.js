import * as OAuthAppAuth from "@octokit/auth-oauth-app";

import { State } from "../types";
import { emitEvent } from "../emit-event";

type StateOptions = "clientType" | "clientId" | "clientSecret" | "request";

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
    | CreateTokenGitHubAppDeviceFlowOptions
): Promise<
  | OAuthAppAuth.OAuthAppUserAuthentication
  | OAuthAppAuth.GitHubAppUserAuthentication
  | OAuthAppAuth.GitHubAppUserAuthenticationWithExpiration
> {
  const result: any = await state.octokit.auth({
    type: "oauth-user",
    ...options,
  });

  await emitEvent(state, {
    name: "token",
    action: "created",
    token: result.token,
    scopes: result.scopes,
    get octokit() {
      return new state.Octokit({ auth: result.token });
    },
  });

  return result;
}

export interface CreateTokenInterface {
  (options: CreateTokenWebFlowOptions): Promise<
    | OAuthAppAuth.OAuthAppUserAuthentication
    | OAuthAppAuth.GitHubAppUserAuthentication
    | OAuthAppAuth.GitHubAppUserAuthenticationWithExpiration
  >;
  (
    options: CreateTokenOAuthAppDeviceFlowOptions
  ): Promise<OAuthAppAuth.OAuthAppUserAuthentication>;
  (options: CreateTokenGitHubAppDeviceFlowOptions): Promise<
    | OAuthAppAuth.GitHubAppUserAuthentication
    | OAuthAppAuth.GitHubAppUserAuthenticationWithExpiration
  >;
}
