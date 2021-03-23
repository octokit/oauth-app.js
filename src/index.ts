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
  deleteTokenWithState,
  DeleteTokenInterface,
} from "./methods/delete-token";
import {
  deleteAuthorizationWithState,
  DeleteAuthorizationInterface,
} from "./methods/delete-authorization";

import {
  ConstructorOptions,
  OctokitInstance,
  ClientType,
  AddEventHandler,
  State,
} from "./types";
export { createNodeMiddleware } from "./middleware/node/index";

export class OAuthApp<TClientType extends ClientType = "oauth-app"> {
  static VERSION = VERSION;

  constructor(options: ConstructorOptions<TClientType>) {
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

    this.on = addEventHandler.bind(null, state) as AddEventHandler<TClientType>;
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
    this.deleteToken = deleteTokenWithState.bind(null, state);
    this.deleteAuthorization = deleteAuthorizationWithState.bind(null, state);
  }

  // assigned during constructor
  type: TClientType;
  on: AddEventHandler<TClientType>;
  octokit: OctokitInstance;
  getUserOctokit: GetUserOctokitWithStateInterface<TClientType>;
  getWebFlowAuthorizationUrl: GetWebFlowAuthorizationUrlInterface<TClientType>;
  createToken: CreateTokenInterface<TClientType>;
  checkToken: CheckTokenInterface<TClientType>;
  resetToken: ResetTokenInterface<TClientType>;
  refreshToken: RefreshTokenInterface;
  deleteToken: DeleteTokenInterface;
  deleteAuthorization: DeleteAuthorizationInterface;
}
