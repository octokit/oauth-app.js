// ************************************************************
// THIS CODE IS NOT EXECUTED. IT IS JUST FOR TYPECHECKING
// ************************************************************

import { OAuthApp } from "../src";

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
  result.scopes;

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

  // @ts-expect-error scopes option not permitted for GitHub Apps
  await githubApp.createToken({
    onVerification() {},
    scopes: [],
  });

  githubApp.on("token.created", (context) => {
    // @ts-expect-error
    context.scopes;

    if ("refreshToken" in context.authentication) {
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
