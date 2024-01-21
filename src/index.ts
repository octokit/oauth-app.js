import { createOAuthAppAuth } from "@octokit/auth-oauth-app";

import { VERSION } from "./version";
import { addEventHandler } from "./add-event-handler";
import { OAuthAppOctokit } from "./oauth-app-octokit";

import {
  getUserOctokitWithState,
  type GetUserOctokitWithStateInterface,
} from "./methods/get-user-octokit.js";
import {
  type GetWebFlowAuthorizationUrlInterface,
  getWebFlowAuthorizationUrlWithState,
} from "./methods/get-web-flow-authorization-url.js";
import {
  type CreateTokenInterface,
  createTokenWithState,
} from "./methods/create-token.js";
import {
  type CheckTokenInterface,
  checkTokenWithState,
} from "./methods/check-token.js";
import {
  type ResetTokenInterface,
  resetTokenWithState,
} from "./methods/reset-token.js";
import {
  type RefreshTokenInterface,
  refreshTokenWithState,
} from "./methods/refresh-token.js";
import {
  type ScopeTokenInterface,
  scopeTokenWithState,
} from "./methods/scope-token.js";
import {
  type DeleteTokenInterface,
  deleteTokenWithState,
} from "./methods/delete-token.js";
import {
  type DeleteAuthorizationInterface,
  deleteAuthorizationWithState,
} from "./methods/delete-authorization.js";

import type {
  AddEventHandler,
  ClientType,
  ClientTypeFromOptions,
  ConstructorOptions,
  OctokitTypeFromOptions,
  Options,
  State,
} from "./types.js";

// types required by external handlers (aws-lambda, etc)
export type {
  HandlerOptions,
  OctokitRequest,
  OctokitResponse,
} from "./middleware/types.js";

// generic handlers
export { handleRequest } from "./middleware/handle-request.js";
export { unknownRouteResponse } from "./middleware/unknown-route-response.js";

export { createNodeMiddleware } from "./middleware/node/index.js";
export { sendResponse as sendNodeResponse } from "./middleware/node/send-response.js";
export { createWebWorkerHandler } from "./middleware/web-worker/index.js";
export { createAWSLambdaAPIGatewayV2Handler } from "./middleware/aws-lambda/api-gateway-v2.js";

type Constructor<T> = new (...args: any[]) => T;

export class OAuthApp<
  TOptions extends Options<ClientType> = Options<"oauth-app">,
> {
  static VERSION = VERSION;

  static defaults<
    TDefaults extends Options<ClientType>,
    S extends Constructor<OAuthApp<TDefaults>>,
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
      // @ts-expect-error refreshToken not permitted for OAuth Apps
      refreshToken: options.refreshToken || "opt-out",
      // @ts-expect-error defaultScopes not permitted for GitHub Apps
      defaultScopes: options.defaultScopes || [],
      allowSignup: options.allowSignup,
      baseUrl: options.baseUrl,
      redirectUrl: options.redirectUrl,
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
      state,
    ) as GetWebFlowAuthorizationUrlInterface<ClientTypeFromOptions<TOptions>>;

    this.createToken = createTokenWithState.bind(
      null,
      state,
    ) as CreateTokenInterface<TOptions>[ClientTypeFromOptions<TOptions>];
    this.checkToken = checkTokenWithState.bind(
      null,
      state,
    ) as CheckTokenInterface<ClientTypeFromOptions<TOptions>>;
    this.resetToken = resetTokenWithState.bind(
      null,
      state,
    ) as ResetTokenInterface<ClientTypeFromOptions<TOptions>>;
    this.refreshToken = refreshTokenWithState.bind(
      null,
      state,
    ) as RefreshTokenInterface;
    this.scopeToken = scopeTokenWithState.bind(
      null,
      state,
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
  createToken: CreateTokenInterface<TOptions>[ClientTypeFromOptions<TOptions>];
  checkToken: CheckTokenInterface<ClientTypeFromOptions<TOptions>>;
  resetToken: ResetTokenInterface<ClientTypeFromOptions<TOptions>>;
  refreshToken: RefreshTokenInterface;
  scopeToken: ScopeTokenInterface;
  deleteToken: DeleteTokenInterface;
  deleteAuthorization: DeleteAuthorizationInterface;
}
