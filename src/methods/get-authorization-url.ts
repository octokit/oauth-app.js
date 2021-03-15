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
  const {
    clientId = state.clientId,
    allowSignup = state.allowSignup,
    baseUrl = state.baseUrl,
    scopes = state.defaultScopes,
    // TODO: https://github.com/octokit/oauth-app.js/pull/203#issuecomment-799683991
    clientType = /^lv1\./.test(clientId) ? "github-app" : "oauth-app",
    ...otherOptions
  } = options;

  if (clientType === "oauth-app") {
    return getAuthorizationUrl({
      ...otherOptions,
      clientType: "oauth-app",
      clientId,
      allowSignup,
      baseUrl,
      scopes,
    });
  }

  return getAuthorizationUrl({
    ...otherOptions,
    clientType: "github-app",
    clientId,
    allowSignup,
    baseUrl,
  });
}

export type AppGetAuthorizationUrl = (options: StateOptions) => string;
