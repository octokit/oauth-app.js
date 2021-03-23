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
export type ActionName = "created" | "reset" | "deleted";
export type EventAndActionName =
  | "token"
  | "token.created"
  | "token.reset"
  | "token.deleted"
  | "authorization"
  | "authorization.deleted";

export type ConstructorOptions = {
  clientId: ClientId;
  clientSecret: ClientSecret;
  clientType?: ClientType;
  defaultScopes?: Scope[];
  allowSignup?: boolean;
  baseUrl?: string;
  log?: typeof console;
  Octokit?: typeof OAuthAppOctokit;
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
    [key: string]: EventHandler[];
  };
};

export type EventHandlerContext = {
  name: EventName;
  action: ActionName;
  token: Token;
  scopes?: Scope[];
  octokit: InstanceType<typeof OAuthAppOctokit>;
  authentication?:
    | OAuthAppUserAuthentication
    | GitHubAppUserAuthentication
    | GitHubAppUserAuthenticationWithExpiration;
};
export type EventHandler = (context: EventHandlerContext) => void;
export type AddEventHandler = (
  eventName: EventAndActionName | EventAndActionName[],
  eventHandler: EventHandler
) => void;

// https://stackoverflow.com/questions/52703321/make-some-properties-optional-in-a-typescript-type#comment96954632_52703444
type Diff<T, U> = T extends U ? never : T;
export type RequiredExceptFor<T, TOptional extends keyof T> = Pick<
  T,
  Diff<keyof T, TOptional>
> &
  Partial<T>;
