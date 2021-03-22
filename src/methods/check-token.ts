import * as OAuthMethods from "@octokit/oauth-methods";

import { State } from "../types";

export type CheckTokenOptions = {
  token: string;
};

export async function checkTokenWithState(
  state: State,
  options: CheckTokenOptions
): Promise<
  | OAuthMethods.CheckTokenOAuthAppResponse
  | OAuthMethods.CheckTokenGitHubAppResponse
> {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options,
  };

  if (state.clientType === "oauth-app") {
    return OAuthMethods.checkToken({
      clientType: "oauth-app",
      ...optionsWithDefaults,
    });
  }

  return OAuthMethods.checkToken({
    clientType: "github-app",
    ...optionsWithDefaults,
  });
}

export interface CheckTokenInterface {
  (options: CheckTokenOptions): Promise<
    | OAuthMethods.CheckTokenOAuthAppResponse
    | OAuthMethods.CheckTokenGitHubAppResponse
  >;
}
