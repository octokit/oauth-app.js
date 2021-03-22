import * as OAuthMethods from "@octokit/oauth-methods";

import { State } from "../types";

export type CheckTokenOptions = {
  token: string;
};

export async function checkTokenWithState(
  state: State,
  options: CheckTokenOptions
): Promise<
  | OAuthMethods.CheckTokenOAuthAppResponse["authentication"]
  | OAuthMethods.CheckTokenGitHubAppResponse["authentication"]
> {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options,
  };

  const { authentication } =
    state.clientType === "oauth-app"
      ? await OAuthMethods.checkToken({
          clientType: "oauth-app",
          ...optionsWithDefaults,
        })
      : await OAuthMethods.checkToken({
          clientType: "github-app",
          ...optionsWithDefaults,
        });

  return authentication;
}

export interface CheckTokenInterface {
  (options: CheckTokenOptions): Promise<
    | OAuthMethods.CheckTokenOAuthAppResponse["authentication"]
    | OAuthMethods.CheckTokenGitHubAppResponse["authentication"]
  >;
}
