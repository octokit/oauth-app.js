import {
  createOAuthUserAuth,
  OAuthAppStrategyOptionsWebFlow,
  OAuthAppStrategyOptionsDeviceFlow,
  OAuthAppStrategyOptionsExistingAuthentication,
  GitHubAppStrategyOptionsWebFlow,
  GitHubAppStrategyOptionsDeviceFlow,
  GitHubAppStrategyOptionsExistingAuthentication,
  GitHubAppStrategyOptionsExistingAuthenticationWithExpiration,
} from "@octokit/auth-oauth-user";

import { State, OctokitInstance, ClientType } from "../types";

type StateOptions = "clientType" | "clientId" | "clientSecret" | "request";

export type GetUserOctokitOAuthAppOptions =
  | Omit<OAuthAppStrategyOptionsWebFlow, StateOptions>
  | Omit<OAuthAppStrategyOptionsDeviceFlow, StateOptions>
  | Omit<OAuthAppStrategyOptionsExistingAuthentication, StateOptions>;
export type GetUserOctokitGitHubAppOptions =
  | Omit<GitHubAppStrategyOptionsWebFlow, StateOptions>
  | Omit<GitHubAppStrategyOptionsDeviceFlow, StateOptions>
  | Omit<GitHubAppStrategyOptionsExistingAuthentication, StateOptions>
  | Omit<
      GitHubAppStrategyOptionsExistingAuthenticationWithExpiration,
      StateOptions
    >;

export async function getUserOctokitWithState(
  state: State,
  options: GetUserOctokitOAuthAppOptions | GetUserOctokitGitHubAppOptions
) {
  return state.octokit.auth({
    type: "oauth-user",
    ...options,
    factory(options: any) {
      return new state.Octokit({
        authStrategy: createOAuthUserAuth,
        auth: options,
      });
    },
  }) as Promise<OctokitInstance>;
}

export interface GetUserOctokitWithStateInterface<
  TClientType extends ClientType
> {
  (
    options: TClientType extends "oauth-app"
      ? GetUserOctokitOAuthAppOptions
      : GetUserOctokitGitHubAppOptions
  ): Promise<OctokitInstance>;
}
