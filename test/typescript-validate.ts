// ************************************************************
// THIS CODE IS NOT EXECUTED. IT IS JUST FOR TYPECHECKING
// ************************************************************

import { Octokit } from "@octokit/core";
import { OAuthApp } from "../src/index.ts";

function expect<T>(what: T) {}

export function CustomOctokitTest() {
  const MyOctokit = Octokit.plugin(() => {
    return {
      foo: "bar",
    };
  });

  const testOctokit = new MyOctokit();
  expect<string>(testOctokit.foo);

  const app = new OAuthApp({
    clientId: "",
    clientSecret: "",
    Octokit: MyOctokit,
  });

  expect<string>(app.octokit.foo);

  app.on("token.created", ({ octokit }) => {
    expect<string>(octokit.foo);
  });
}

export function CustomOctokitFromDefaultsTest() {
  const MyOctokit = Octokit.plugin(() => {
    return {
      foo: "bar",
    };
  });

  const MyApp = OAuthApp.defaults({
    Octokit: MyOctokit,
  });

  const app = new MyApp({
    clientId: "",
    clientSecret: "",
  });

  expect<string>(app.octokit.foo);
}

export async function OAuthAppTest() {
  const oauthApp = new OAuthApp({
    clientType: "oauth-app",
    clientId: "",
    clientSecret: "",
    defaultScopes: [],
  });

  oauthApp.type;

  const result = await oauthApp.createToken({
    onVerification() {},
    scopes: [],
  });
  result.authentication.scopes;

  oauthApp.on("token.created", (context) => {
    context.scopes;
  });

  oauthApp.getWebFlowAuthorizationUrl({
    scopes: ["repo"],
  });

  const checkTokenResult = await oauthApp.checkToken({ token: "" });
  checkTokenResult.authentication.scopes;

  const resetTokenResult = await oauthApp.resetToken({ token: "" });
  resetTokenResult.authentication.scopes;

  await oauthApp.getUserOctokit({
    onVerification: () => {},
    scopes: [],
  });
}

export async function GitHubAppTest() {
  const githubApp = new OAuthApp({
    clientType: "github-app",
    clientId: "",
    clientSecret: "",
  });
  githubApp.type;

  const result = await githubApp.createToken({
    onVerification() {},
  });
  // @ts-expect-error scopes are not used by GitHub Apps
  result.scopes;

  result.authentication.expiresAt;
  result.authentication.refreshTokenExpiresAt;
  result.authentication.refreshToken;

  // @ts-expect-error scopes option not permitted for GitHub Apps
  await githubApp.createToken({
    onVerification() {},
    scopes: [],
  });

  githubApp.on("token.created", (context) => {
    // @ts-expect-error
    context.scopes;

    if (context.authentication && "refreshToken" in context.authentication) {
      context.authentication.refreshTokenExpiresAt;
    }
  });

  githubApp.getWebFlowAuthorizationUrl({
    // @ts-expect-error
    scopes: ["repo"],
  });

  const checkTokenResult = await githubApp.checkToken({ token: "" });
  // @ts-expect-error
  checkTokenResult.scopes;

  const resetTokenResult = await githubApp.resetToken({ token: "" });
  // @ts-expect-error
  resetTokenResult.authentication.scopes;

  await githubApp.getUserOctokit({
    onVerification: () => {},
    // @ts-expect-error
    scopes: ["funky"],
  });
}
