import { oauthAuthorizationUrl } from "@octokit/oauth-authorization-url";

import { State, RequiredExceptFor } from "../types";

type StaticOptions = Parameters<typeof oauthAuthorizationUrl>[0];
type StateOptions = RequiredExceptFor<StaticOptions, "clientId">;

export function getAuthorizationUrl(options: StaticOptions) {
  const { url } = oauthAuthorizationUrl(options);
  return url;
}

export function getAuthorizationUrlWithState(
  state: State,
  options: StateOptions
) {
  return getAuthorizationUrl({
    ...options,
    clientId: options.clientId || state.clientId,
    allowSignup: options.allowSignup || state.allowSignup,
    baseUrl: options.baseUrl || state.baseUrl,
    scopes: options.scopes || state.defaultScopes,
  });
}

export type AppGetAuthorizationUrl = (options: StateOptions) => string;
