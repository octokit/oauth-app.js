import * as OAuthMethods from "@octokit/oauth-methods";

import { State } from "../types";

type StateOptions = "clientType" | "clientId" | "clientSecret" | "request";

export type GetWebFlowAuthorizationUrlOAuthAppOptions = Omit<
  OAuthMethods.GetWebFlowAuthorizationUrlOAuthAppOptions,
  StateOptions
>;
export type GetWebFlowAuthorizationUrlGitHubAppOptions = Omit<
  OAuthMethods.GetWebFlowAuthorizationUrlGitHubAppOptions,
  StateOptions
>;

export function getWebFlowAuthorizationUrlWithState(
  state: State,
  options:
    | GetWebFlowAuthorizationUrlOAuthAppOptions
    | GetWebFlowAuthorizationUrlGitHubAppOptions
):
  | OAuthMethods.GetWebFlowAuthorizationUrlOAuthAppResult
  | OAuthMethods.GetWebFlowAuthorizationUrlGitHubAppResult {
  const optionsWithDefaults = {
    clientId: state.clientId,
    request: state.octokit.request,
    ...options,
    allowSignup: options.allowSignup || state.allowSignup,
    // @ts-expect-error options.scopes not set for GitHub Apps
    scopes: options.scopes || state.defaultScopes,
  };

  if (state.clientType === "oauth-app") {
    return OAuthMethods.getWebFlowAuthorizationUrl({
      clientType: "oauth-app",
      ...optionsWithDefaults,
    });
  }

  return OAuthMethods.getWebFlowAuthorizationUrl({
    clientType: "github-app",
    ...optionsWithDefaults,
  });
}

export interface GetWebFlowAuthorizationUrlInterface {
  (
    options: GetWebFlowAuthorizationUrlOAuthAppOptions
  ): OAuthMethods.GetWebFlowAuthorizationUrlOAuthAppResult;
  (
    options: GetWebFlowAuthorizationUrlGitHubAppOptions
  ): OAuthMethods.GetWebFlowAuthorizationUrlGitHubAppResult;
}
