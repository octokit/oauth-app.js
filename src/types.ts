import {
  OAuthAppUserAuthentication,
  GitHubAppUserAuthentication,
  GitHubAppUserAuthenticationWithExpiration,
} from "@octokit/auth-oauth-app";
import { OAuthAppOctokit } from "./oauth-app-octokit";

export type ClientType = "oauth-app" | "github-app";

export type Scope = string;
export type ClientId = string;
export type ClientSecret = string;
export type Token = string;
export type EventName = "token" | "authorization";
export type ActionName = "created" | "reset" | "deleted" | "refreshed";
export type EventAndActionName =
  | "token"
  | "token.created"
  | "token.reset"
  | "token.refreshed"
  | "token.deleted"
  | "authorization"
  | "authorization.deleted";

type CommonConstructorOptions = {
  clientId: ClientId;
  clientSecret: ClientSecret;
  allowSignup?: boolean;
  baseUrl?: string;
  log?: typeof console;
  Octokit?: typeof OAuthAppOctokit;
};

export type ConstructorOptions<
  TClientType extends ClientType
> = TClientType extends "oauth-app"
  ? CommonConstructorOptions & {
      clientType?: TClientType;
      defaultScopes?: Scope[];
    }
  : CommonConstructorOptions & {
      clientType?: TClientType;
    };

export type OctokitInstance = InstanceType<typeof OAuthAppOctokit>;
export type State = {
  clientType: ClientType;
  clientId: ClientId;
  clientSecret: ClientSecret;
  defaultScopes: Scope[];
  allowSignup?: boolean;
  baseUrl?: string;
  log?: typeof console;
  Octokit: typeof OAuthAppOctokit;
  octokit: OctokitInstance;
  eventHandlers: {
    [key: string]: EventHandler<ClientType>[];
  };
};

export type EventHandlerContext<
  TClientType extends ClientType
> = TClientType extends "oauth-app"
  ? {
      name: EventName;
      action: ActionName;
      token: Token;
      scopes?: Scope[];
      octokit: InstanceType<typeof OAuthAppOctokit>;
      authentication?: OAuthAppUserAuthentication;
    }
  : {
      name: EventName;
      action: ActionName;
      token: Token;
      octokit: InstanceType<typeof OAuthAppOctokit>;
      authentication?:
        | GitHubAppUserAuthentication
        | GitHubAppUserAuthenticationWithExpiration;
    };
export type EventHandler<TClientType extends ClientType> = (
  context: EventHandlerContext<TClientType>
) => void;
export type AddEventHandler<TClientType extends ClientType> = (
  eventName: EventAndActionName | EventAndActionName[],
  eventHandler: EventHandler<TClientType>
) => void;
