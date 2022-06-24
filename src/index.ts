import { createOAuthAppAuth } from "@octokit/auth-oauth-app";

import { VERSION } from "./version";
import { addEventHandler } from "./add-event-handler";
import { OAuthAppOctokit } from "./oauth-app-octokit";

import {
  getUserOctokitWithState,
  GetUserOctokitWithStateInterface,
} from "./methods/get-user-octokit";
import {
  GetWebFlowAuthorizationUrlInterface,
  getWebFlowAuthorizationUrlWithState,
} from "./methods/get-web-flow-authorization-url";
import {
  CreateTokenInterface,
  createTokenWithState,
} from "./methods/create-token";
import {
  CheckTokenInterface,
  checkTokenWithState,
} from "./methods/check-token";
import {
  ResetTokenInterface,
  resetTokenWithState,
} from "./methods/reset-token";
import {
  RefreshTokenInterface,
  refreshTokenWithState,
} from "./methods/refresh-token";
import {
  ScopeTokenInterface,
  scopeTokenWithState,
} from "./methods/scope-token";
import {
  DeleteTokenInterface,
  deleteTokenWithState,
} from "./methods/delete-token";
import {
  DeleteAuthorizationInterface,
  deleteAuthorizationWithState,
} from "./methods/delete-authorization";

import type {
  AddEventHandler,
  ClientType,
  ClientTypeFromOptions,
  ConstructorOptions,
  OctokitTypeFromOptions,
  Options,
  State,
} from "./types";
export { createNodeMiddleware } from "./middleware/node/index";
export {
  createCloudflareHandler,
  createWebWorkerHandler,
} from "./middleware/web-worker/index";
export { createAWSLambdaAPIGatewayV2Handler } from "./middleware/aws-lambda/api-gateway-v2";

type Constructor<T> = new (...args: any[]) => T;

export class OAuthApp<
  TOptions extends Options<ClientType> = Options<"oauth-app">
> {
  static VERSION = VERSION;

  static defaults<
    TDefaults extends Options<ClientType>,
    S extends Constructor<OAuthApp<TDefaults>>
  >(this: S, defaults: TDefaults) {
    const OAuthAppWithDefaults = class extends this {
      constructor(...args: any[]) {
        super({
          ...defaults,
          ...args[0],
        });
      }
    };

    return OAuthAppWithDefaults as typeof OAuthAppWithDefaults & typeof this;
  }

  constructor(options: ConstructorOptions<TOptions>) {
    const Octokit = options.Octokit || OAuthAppOctokit;
    this.type = (options.clientType ||
      "oauth-app") as ClientTypeFromOptions<TOptions>;
    const octokit = new Octokit({
      authStrategy: createOAuthAppAuth,
      auth: {
        clientType: this.type,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
      },
    });

    const state: State = {
      clientType: this.type,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      // @ts-expect-error defaultScopes not permitted for GitHub Apps
      defaultScopes: options.defaultScopes || [],
      allowSignup: options.allowSignup,
      baseUrl: options.baseUrl,
      log: options.log,
      Octokit,
      octokit,
      eventHandlers: {},
    };

    this.on = addEventHandler.bind(null, state) as AddEventHandler<TOptions>;

    // @ts-expect-error TODO: figure this out
    this.octokit = octokit;

    this.getUserOctokit = getUserOctokitWithState.bind(null, state);

    this.getWebFlowAuthorizationUrl = getWebFlowAuthorizationUrlWithState.bind(
      null,
      state
    ) as GetWebFlowAuthorizationUrlInterface<ClientTypeFromOptions<TOptions>>;

    this.createToken = createTokenWithState.bind(
      null,
      state
    ) as CreateTokenInterface<ClientTypeFromOptions<TOptions>>;
    this.checkToken = checkTokenWithState.bind(
      null,
      state
    ) as CheckTokenInterface<ClientTypeFromOptions<TOptions>>;
    this.resetToken = resetTokenWithState.bind(
      null,
      state
    ) as ResetTokenInterface<ClientTypeFromOptions<TOptions>>;
    this.refreshToken = refreshTokenWithState.bind(
      null,
      state
    ) as RefreshTokenInterface;
    this.scopeToken = scopeTokenWithState.bind(
      null,
      state
    ) as ScopeTokenInterface;
    this.deleteToken = deleteTokenWithState.bind(null, state);
    this.deleteAuthorization = deleteAuthorizationWithState.bind(null, state);
  }

  // assigned during constructor
  type: ClientTypeFromOptions<TOptions>;
  on: AddEventHandler<TOptions>;
  octokit: OctokitTypeFromOptions<TOptions>;
  getUserOctokit: GetUserOctokitWithStateInterface<
    ClientTypeFromOptions<TOptions>
  >;
  getWebFlowAuthorizationUrl: GetWebFlowAuthorizationUrlInterface<
    ClientTypeFromOptions<TOptions>
  >;
  createToken: CreateTokenInterface<ClientTypeFromOptions<TOptions>>;
  checkToken: CheckTokenInterface<ClientTypeFromOptions<TOptions>>;
  resetToken: ResetTokenInterface<ClientTypeFromOptions<TOptions>>;
  refreshToken: RefreshTokenInterface;
  scopeToken: ScopeTokenInterface;
  deleteToken: DeleteTokenInterface;
  deleteAuthorization: DeleteAuthorizationInterface;
}
