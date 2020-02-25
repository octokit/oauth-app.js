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
  return getAuthorizationUrl(
    Object.assign(
      {
        clientId: state.clientId,
        allowSignup: state.allowSignup,
        baseUrl: state.baseUrl,
        log: state.log,
        scopes: state.defaultScopes
      },
      options
    )
  );
}

export type AppGetAuthorizationUrl = (options: StateOptions) => string;
