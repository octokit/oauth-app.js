import {
  createOAuthAppAuth,
  createOAuthUserAuth,
} from "@octokit/auth-oauth-app";

import { VERSION } from "./version";
import { addEventHandler } from "./add-event-handler";
import { OAuthAppOctokit } from "./oauth-app-octokit";

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

export class OAuthApp {
  static VERSION = VERSION;

  constructor(options: ConstructorOptions) {
    const Octokit = options.Octokit || OAuthAppOctokit;
    this.type = options.clientType || "oauth-app";
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
      defaultScopes: options.defaultScopes || [],
      allowSignup: options.allowSignup,
      baseUrl: options.baseUrl,
      log: options.log,
      Octokit,
      octokit,
      eventHandlers: {},
    };

    this.on = addEventHandler.bind(null, state);
    this.octokit = octokit;
    this.getUserOctokit = async (options: any) => {
      return octokit.auth({
        type: "oauth-user",
        ...options,
        factory(options: any) {
          return new Octokit({
            authStrategy: createOAuthUserAuth,
            auth: options,
          });
        },
      }) as Promise<OctokitInstance>;
    };

    this.getWebFlowAuthorizationUrl = getWebFlowAuthorizationUrlWithState.bind(
      null,
      state
    ) as GetWebFlowAuthorizationUrlInterface;

    this.createToken = createTokenWithState.bind(
      null,
      state
    ) as CreateTokenInterface;
    this.checkToken = checkTokenWithState.bind(null, state);
    this.resetToken = resetTokenWithState.bind(null, state);
    this.deleteToken = deleteTokenWithState.bind(null, state);
    this.deleteAuthorization = deleteAuthorizationWithState.bind(null, state);
  }

  // assigned during constructor
  type: ClientType;
  on: AddEventHandler;
  octokit: OctokitInstance;
  getUserOctokit: (options: any) => Promise<OctokitInstance>;
  getWebFlowAuthorizationUrl: GetWebFlowAuthorizationUrlInterface;
  createToken: CreateTokenInterface;
  checkToken: CheckTokenInterface;
  resetToken: ResetTokenInterface;
  deleteToken: DeleteTokenInterface;
  deleteAuthorization: DeleteAuthorizationInterface;
}
