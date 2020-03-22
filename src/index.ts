import { createOAuthAppAuth } from "@octokit/auth-oauth-app";

import { VERSION } from "./version";
import { addEventHandler } from "./add-event-handler";
import { OAuthAppOctokit } from "./oauth-app-octokit";

import {
  getAuthorizationUrlWithState,
  AppGetAuthorizationUrl,
} from "./methods/get-authorization-url";
import { createTokenWithState, AppCreateToken } from "./methods/create-token";
import { checkTokenWithState, AppCheckToken } from "./methods/check-token";
import { resetTokenWithState, AppResetToken } from "./methods/reset-token";
import { deleteTokenWithState, AppDeleteToken } from "./methods/delete-token";
import {
  deleteAuthorizationWithState,
  AppDeleteAuthorization,
} from "./methods/delete-authorization";

import {
  ConstructorOptions,
  OctokitInstance,
  AddEventHandler,
  State,
} from "./types";

export { getAuthorizationUrl } from "./methods/get-authorization-url";
export { createToken } from "./methods/create-token";
export { checkToken } from "./methods/check-token";
export { resetToken } from "./methods/reset-token";
export { deleteToken } from "./methods/delete-token";
export { deleteAuthorization } from "./methods/delete-authorization";
export { getNodeMiddleware } from "./middleware/node/index";

export class OAuthApp {
  static VERSION = VERSION;

  constructor(options: ConstructorOptions) {
    const Octokit = options.Octokit || OAuthAppOctokit;
    const octokit = new Octokit({
      authStrategy: createOAuthAppAuth,
      auth: {
        clientId: options.clientId,
        clientSecret: options.clientSecret,
      },
    });

    const state: State = {
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
    this.getAuthorizationUrl = getAuthorizationUrlWithState.bind(null, state);
    this.createToken = createTokenWithState.bind(null, state);
    this.checkToken = checkTokenWithState.bind(null, state);
    this.resetToken = resetTokenWithState.bind(null, state);
    this.deleteToken = deleteTokenWithState.bind(null, state);
    this.deleteAuthorization = deleteAuthorizationWithState.bind(null, state);
  }

  // assigned during constructor
  on: AddEventHandler;
  octokit: OctokitInstance;
  getAuthorizationUrl: AppGetAuthorizationUrl;
  createToken: AppCreateToken;
  checkToken: AppCheckToken;
  resetToken: AppResetToken;
  deleteToken: AppDeleteToken;
  deleteAuthorization: AppDeleteAuthorization;
}
