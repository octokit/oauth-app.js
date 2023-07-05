import * as OAuthMethods from "@octokit/oauth-methods";

import type { ClientType, State } from "../types";

export type CheckTokenOptions = {
  token: string;
};

export async function checkTokenWithState(
  state: State,
  options: CheckTokenOptions,
): Promise<any> {
  const result = await OAuthMethods.checkToken({
    // @ts-expect-error not worth the extra code to appease TS
    clientType: state.clientType,
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options,
  });
  Object.assign(result.authentication, { type: "token", tokenType: "oauth" });
  return result;
}

export interface CheckTokenInterface<TClientType extends ClientType> {
  (options: CheckTokenOptions): (TClientType extends "oauth-app"
    ? Promise<OAuthMethods.CheckTokenOAuthAppResponse>
    : Promise<OAuthMethods.CheckTokenGitHubAppResponse>) & {
    authentication: {
      type: "token";
      tokenType: "oauth";
    };
  };
}
