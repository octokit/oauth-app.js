import * as OAuthMethods from "@octokit/oauth-methods";

import { ClientType, State } from "../types";

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
  options: any
): any {
  let allowSignup: boolean;
  if (options.allowSignup === undefined && state.allowSignup === undefined) {
    allowSignup = true;
  } else if (
    options.allowSignup === undefined &&
    state.allowSignup !== undefined
  ) {
    allowSignup = state.allowSignup;
  } else if (
    state.allowSignup === undefined &&
    options.allowSignup !== undefined
  ) {
    allowSignup = options.allowSignup;
  } else {
    allowSignup = options.allowSignup || state.allowSignup;
  }
  const optionsWithDefaults = {
    clientId: state.clientId,
    request: state.octokit.request,
    ...options,
    allowSignup,
    scopes: options.scopes || state.defaultScopes,
  };

  return OAuthMethods.getWebFlowAuthorizationUrl({
    clientType: state.clientType,
    ...optionsWithDefaults,
  });
}

export interface GetWebFlowAuthorizationUrlInterface<
  TClientType extends ClientType
> {
  (
    options: TClientType extends "oauth-app"
      ? GetWebFlowAuthorizationUrlOAuthAppOptions
      : GetWebFlowAuthorizationUrlGitHubAppOptions
  ): TClientType extends "oauth-app"
    ? OAuthMethods.GetWebFlowAuthorizationUrlOAuthAppResult
    : OAuthMethods.GetWebFlowAuthorizationUrlGitHubAppResult;
}
