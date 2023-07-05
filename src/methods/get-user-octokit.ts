import { createOAuthUserAuth } from "@octokit/auth-oauth-user";

import type {
  OAuthAppStrategyOptionsWebFlow,
  OAuthAppStrategyOptionsDeviceFlow,
  OAuthAppStrategyOptionsExistingAuthentication,
  GitHubAppStrategyOptionsWebFlow,
  GitHubAppStrategyOptionsDeviceFlow,
  GitHubAppStrategyOptionsExistingAuthentication,
  GitHubAppStrategyOptionsExistingAuthenticationWithExpiration,
  OAuthAppAuthentication,
} from "@octokit/auth-oauth-user";

import type { State, OctokitInstance, ClientType } from "../types";
import { emitEvent } from "../emit-event";

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
  options: GetUserOctokitOAuthAppOptions | GetUserOctokitGitHubAppOptions,
) {
  return state.octokit.auth({
    type: "oauth-user",
    ...options,
    async factory(options: any) {
      const octokit = new state.Octokit({
        authStrategy: createOAuthUserAuth,
        auth: options,
      });

      const authentication = (await octokit.auth({
        type: "get",
      })) as OAuthAppAuthentication;

      await emitEvent(state, {
        name: "token",
        action: "created",
        token: authentication.token,
        scopes: authentication.scopes,
        authentication,
        octokit,
      });

      return octokit;
    },
  }) as Promise<OctokitInstance>;
}

export interface GetUserOctokitWithStateInterface<
  TClientType extends ClientType,
> {
  (
    options: TClientType extends "oauth-app"
      ? GetUserOctokitOAuthAppOptions
      : GetUserOctokitGitHubAppOptions,
  ): Promise<OctokitInstance>;
}
