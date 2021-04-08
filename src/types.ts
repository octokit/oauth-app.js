import {
  OAuthAppUserAuthentication,
  GitHubAppUserAuthentication,
  GitHubAppUserAuthenticationWithExpiration,
} from "@octokit/auth-oauth-app";

import { OAuthAppOctokit } from "./oauth-app-octokit";

export type ClientType = "oauth-app" | "github-app";
export type OAuthAppOctokitClassType = typeof OAuthAppOctokit;

export type Scope = string;
export type ClientId = string;
export type ClientSecret = string;
export type Token = string;
export type EventName = "token" | "authorization";
export type ActionName =
  | "created"
  | "reset"
  | "deleted"
  | "refreshed"
  | "scoped";
export type EventAndActionName =
  | "token"
  | "token.created"
  | "token.reset"
  | "token.refreshed"
  | "token.scoped"
  | "token.deleted"
  | "authorization"
  | "authorization.deleted";

type CommonOptions<TOctokit extends OAuthAppOctokitClassType> = {
  clientId?: ClientId;
  clientSecret?: ClientSecret;
  allowSignup?: boolean;
  baseUrl?: string;
  log?: typeof console;
  Octokit?: TOctokit;
};

export type Options<
  TClientType extends ClientType,
  TOctokit extends OAuthAppOctokitClassType = OAuthAppOctokitClassType
> = TClientType extends "oauth-app"
  ? CommonOptions<TOctokit> & {
      clientType?: TClientType;
      defaultScopes?: Scope[];
    }
  : CommonOptions<TOctokit> & {
      clientType?: TClientType;
    };

// workaround for https://github.com/octokit/oauth-app.js/pull/216
// we cannot make clientId & clientSecret required on Options because
// it would break inheritance of the Octokit option set via App.defaults({ Octokit })
export type ConstructorOptions<
  TOptions extends Options<ClientType>
> = TOptions & {
  clientId: ClientId;
  clientSecret: ClientSecret;
};

export type OctokitInstance = InstanceType<OAuthAppOctokitClassType>;
export type State = {
  clientType: ClientType;
  clientId: ClientId;
  clientSecret: ClientSecret;
  defaultScopes: Scope[];
  allowSignup?: boolean;
  baseUrl?: string;
  log?: typeof console;
  Octokit: OAuthAppOctokitClassType;
  octokit: OctokitInstance;
  eventHandlers: {
    [key: string]: EventHandler<ClientType, OAuthAppOctokitClassType>[];
  };
};

export type EventHandlerContext<
  TClientType extends ClientType,
  TOctokit extends OAuthAppOctokitClassType
> = TClientType extends "oauth-app"
  ? {
      name: EventName;
      action: ActionName;
      token: Token;
      scopes?: Scope[];
      octokit: InstanceType<TOctokit>;
      authentication?: OAuthAppUserAuthentication;
    }
  : {
      name: EventName;
      action: ActionName;
      token: Token;
      octokit: InstanceType<TOctokit>;
      authentication?:
        | GitHubAppUserAuthentication
        | GitHubAppUserAuthenticationWithExpiration;
    };
export type EventHandler<
  TClientType extends ClientType,
  TOctokit extends OAuthAppOctokitClassType
> = (context: EventHandlerContext<TClientType, TOctokit>) => void;
export type AddEventHandler<
  TClientType extends ClientType,
  TOctokit extends OAuthAppOctokitClassType
> = (
  eventName: EventAndActionName | EventAndActionName[],
  eventHandler: EventHandler<TClientType, TOctokit>
) => void;
