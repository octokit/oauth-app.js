import { createOAuthAppAuth } from "@octokit/auth-oauth-app";

import { VERSION } from "./version";
import { addEventHandler } from "./add-event-handler";
import { OAuthAppOctokit } from "./oauth-app-octokit";

import {
  getUserOctokitWithState,
  GetUserOctokitWithStateInterface,
} from "./methods/get-user-octokit";
import {
  getWebFlowAuthorizationUrlWithState,
  GetWebFlowAuthorizationUrlInterface,
} from "./methods/get-web-flow-authorization-url";
import {
  createTokenWithState,
  CreateTokenInterface,
} from "./methods/create-token";
import {
  checkTokenWithState,
  CheckTokenInterface,
} from "./methods/check-token";
import {
  resetTokenWithState,
  ResetTokenInterface,
} from "./methods/reset-token";
import {
  refreshTokenWithState,
  RefreshTokenInterface,
} from "./methods/refresh-token";
import {
  scopeTokenWithState,
  ScopeTokenInterface,
} from "./methods/scope-token";
import {
  deleteTokenWithState,
  DeleteTokenInterface,
} from "./methods/delete-token";
import {
  deleteAuthorizationWithState,
  DeleteAuthorizationInterface,
} from "./methods/delete-authorization";

import {
  Options,
  ConstructorOptions,
  OAuthAppOctokitClassType,
  ClientType,
  AddEventHandler,
  State,
} from "./types";
export { createNodeMiddleware } from "./middleware/node/index";

type Constructor<T> = new (...args: any[]) => T;

export class OAuthApp<
  TClientType extends ClientType = "oauth-app",
  TOctokit extends OAuthAppOctokitClassType = OAuthAppOctokitClassType
> {
  static VERSION = VERSION;

  static defaults<
    TClientType extends ClientType,
    TDefaults extends Options<TClientType>,
    S extends Constructor<any>
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

  constructor(options: ConstructorOptions<Options<TClientType, TOctokit>>) {
    const Octokit = options.Octokit || OAuthAppOctokit;
    this.type = (options.clientType || "oauth-app") as TClientType;
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

    this.on = addEventHandler.bind(null, state) as AddEventHandler<
      TClientType,
      TOctokit
    >;

    // @ts-expect-error TODO: figure this out
    this.octokit = octokit;

    this.getUserOctokit = getUserOctokitWithState.bind(null, state);

    this.getWebFlowAuthorizationUrl = getWebFlowAuthorizationUrlWithState.bind(
      null,
      state
    ) as GetWebFlowAuthorizationUrlInterface<TClientType>;

    this.createToken = createTokenWithState.bind(
      null,
      state
    ) as CreateTokenInterface<TClientType>;
    this.checkToken = checkTokenWithState.bind(
      null,
      state
    ) as CheckTokenInterface<TClientType>;
    this.resetToken = resetTokenWithState.bind(
      null,
      state
    ) as ResetTokenInterface<TClientType>;
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
  type: TClientType;
  on: AddEventHandler<TClientType, TOctokit>;
  octokit: InstanceType<TOctokit>;
  getUserOctokit: GetUserOctokitWithStateInterface<TClientType>;
  getWebFlowAuthorizationUrl: GetWebFlowAuthorizationUrlInterface<TClientType>;
  createToken: CreateTokenInterface<TClientType>;
  checkToken: CheckTokenInterface<TClientType>;
  resetToken: ResetTokenInterface<TClientType>;
  refreshToken: RefreshTokenInterface;
  scopeToken: ScopeTokenInterface;
  deleteToken: DeleteTokenInterface;
  deleteAuthorization: DeleteAuthorizationInterface;
}
