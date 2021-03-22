import * as OAuthMethods from "@octokit/oauth-methods";

import { State } from "../types";
import { emitEvent } from "../emit-event";
import { Octokit } from "@octokit/core";

type StateOptions = "clientType" | "clientId" | "clientSecret" | "request";

export type ExchangeWebFlowCodeOAuthAppOptions = Omit<
  OAuthMethods.ExchangeWebFlowCodeOAuthAppOptions,
  StateOptions
>;
export type ExchangeWebFlowCodeGitHubAppOptions = Omit<
  OAuthMethods.ExchangeWebFlowCodeGitHubAppOptions,
  StateOptions
>;

export async function createTokenWithState(
  state: State,
  options:
    | ExchangeWebFlowCodeOAuthAppOptions
    | ExchangeWebFlowCodeGitHubAppOptions
): Promise<
  | OAuthMethods.ExchangeWebFlowCodeOAuthAppResponse
  | OAuthMethods.ExchangeWebFlowCodeGitHubAppResponse
> {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options,
  };

  if (state.clientType === "oauth-app") {
    const response = await OAuthMethods.exchangeWebFlowCode({
      clientType: "oauth-app",
      ...optionsWithDefaults,
    });

    await emitEvent(state, {
      name: "token",
      action: "created",
      token: response.authentication.token,
      scopes: response.authentication.scopes,
      get octokit() {
        return new state.Octokit({ auth: response.authentication.token });
      },
    });

    return response;
  }

  const response = await OAuthMethods.exchangeWebFlowCode({
    clientType: "github-app",
    ...optionsWithDefaults,
  });

  await emitEvent(state, {
    name: "token",
    action: "created",
    token: response.authentication.token,
    get octokit() {
      return new state.Octokit({ auth: response.authentication.token });
    },
  });

  return response;
}

export interface CreateTokenInterface {
  (
    options: ExchangeWebFlowCodeOAuthAppOptions
  ): Promise<OAuthMethods.ExchangeWebFlowCodeOAuthAppResponse>;
  (
    options: ExchangeWebFlowCodeGitHubAppOptions
  ): Promise<OAuthMethods.ExchangeWebFlowCodeGitHubAppResponse>;
}
