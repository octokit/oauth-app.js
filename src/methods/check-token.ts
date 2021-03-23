import * as OAuthMethods from "@octokit/oauth-methods";

import { ClientType, State } from "../types";

export type CheckTokenOptions = {
  token: string;
};

export async function checkTokenWithState(
  state: State,
  options: CheckTokenOptions
): Promise<any> {
  return await OAuthMethods.checkToken({
    // @ts-expect-error not worth the extra code to appease TS
    clientType: state.clientType,
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options,
  });
}

export interface CheckTokenInterface<TClientType extends ClientType> {
  (options: CheckTokenOptions): TClientType extends "oauth-app"
    ? Promise<OAuthMethods.CheckTokenOAuthAppResponse>
    : Promise<OAuthMethods.CheckTokenGitHubAppResponse>;
}
