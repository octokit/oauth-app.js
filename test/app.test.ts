import fetchMock from "fetch-mock";

import { OAuthApp } from "../src";
import { OAuthAppOctokit } from "../src/oauth-app-octokit";

describe("app", () => {
  it("app.getWebFlowAuthorizationUrl(options)", () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });
    const { url } = app.getWebFlowAuthorizationUrl({
      state: "state123",
    });
    expect(url).toStrictEqual(
      "https://github.com/login/oauth/authorize?allow_signup=true&client_id=0123&state=state123"
    );
  });

  it("app.getWebFlowAuthorizationUrl(options) for GitHub App", () => {
    const app = new OAuthApp({
      clientId: "lv1.0123",
      clientSecret: "0123secret",
    });
    const { url } = app.getWebFlowAuthorizationUrl({
      state: "state123",
    });
    expect(url).toStrictEqual(
      "https://github.com/login/oauth/authorize?allow_signup=true&client_id=lv1.0123&state=state123"
    );
  });

  it("app.exchangeWebFlowCode(options)", async () => {
    const mock = fetchMock
      .sandbox()
      .postOnce(
        "https://github.com/login/oauth/access_token",
        {
          access_token: "token123",
          scope: "repo,gist",
          token_type: "bearer",
        },
        {
          body: {
            client_id: "0123",
            client_secret: "0123secret",
            code: "code123",
            state: "state123",
          },
        }
      )
      .getOnce(
        "https://api.github.com/user",
        { login: "octocat" },
        {
          headers: {
            authorization: "token token123",
          },
        }
      );

    const Mocktokit = OAuthAppOctokit.defaults({
      request: {
        fetch: mock,
      },
    });

    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      Octokit: Mocktokit,
    });

    const onTokenCallback = jest.fn();
    app.on("token.created", onTokenCallback);

    const result = await app.exchangeWebFlowCode({
      state: "state123",
      code: "code123",
    });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "authentication": Object {
          "clientId": "0123",
          "clientSecret": "0123secret",
          "clientType": "oauth-app",
          "scopes": Array [
            "repo",
            "gist",
          ],
          "token": "token123",
        },
        "data": Object {
          "access_token": "token123",
          "scope": "repo,gist",
          "token_type": "bearer",
        },
        "headers": Object {
          "content-length": "69",
          "content-type": "application/json",
        },
        "status": 200,
        "url": "https://github.com/login/oauth/access_token",
      }
    `);

    expect(onTokenCallback.mock.calls.length).toEqual(1);
    const [context] = onTokenCallback.mock.calls[0];

    expect(context).toMatchObject({
      token: "token123",
      scopes: ["repo", "gist"],
    });
    expect(context.octokit).toBeInstanceOf(Mocktokit);

    const { data } = await context.octokit.request("GET /user");
    expect(data.login).toEqual("octocat");
  });

  it("app.checkToken(options)", async () => {
    const mock = fetchMock.sandbox().postOnce(
      "https://api.github.com/applications/0123/token",
      { id: 1 },
      {
        headers: {
          authorization:
            "basic " + Buffer.from("0123:0123secret").toString("base64"),
        },
        body: {
          access_token: "token123",
        },
      }
    );

    const Mocktokit = OAuthAppOctokit.defaults({
      request: {
        fetch: mock,
      },
    });

    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      Octokit: Mocktokit,
    });

    const result = await app.checkToken({
      token: "token123",
    });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "authentication": Object {
          "clientId": "0123",
          "clientSecret": "0123secret",
          "clientType": "oauth-app",
          "scopes": undefined,
          "token": "token123",
        },
        "data": Object {
          "id": 1,
        },
        "headers": Object {
          "content-length": "8",
          "content-type": "application/json",
        },
        "status": 200,
        "url": "https://api.github.com/applications/0123/token",
      }
    `);
  });

  it("app.resetToken(options)", async () => {
    const mock = fetchMock.sandbox().patchOnce(
      "https://api.github.com/applications/0123/token",
      {
        id: 2,
        token: "token456",
        scopes: ["repo", "gist"],
      },
      {
        headers: {
          authorization:
            "basic " + Buffer.from("0123:0123secret").toString("base64"),
        },
        body: {
          access_token: "token123",
        },
      }
    );

    const Mocktokit = OAuthAppOctokit.defaults({
      request: {
        fetch: mock,
      },
    });

    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      Octokit: Mocktokit,
    });

    const onTokenCallback = jest.fn();
    app.on("token.reset", onTokenCallback);

    const result = await app.resetToken({
      token: "token123",
    });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "authentication": Object {
          "clientId": "0123",
          "clientSecret": "0123secret",
          "clientType": "oauth-app",
          "scopes": Array [
            "repo",
            "gist",
          ],
          "token": "token456",
        },
        "data": Object {
          "id": 2,
          "scopes": Array [
            "repo",
            "gist",
          ],
          "token": "token456",
        },
        "headers": Object {
          "content-length": "52",
          "content-type": "application/json",
        },
        "status": 200,
        "url": "https://api.github.com/applications/0123/token",
      }
    `);
    expect(onTokenCallback.mock.calls.length).toEqual(1);
    const [context] = onTokenCallback.mock.calls[0];

    expect(context).toMatchObject({
      name: "token",
      action: "reset",
      token: "token456",
      scopes: ["repo", "gist"],
    });
    expect(context.octokit).toBeInstanceOf(Mocktokit);
  });

  it("app.resetToken(options) with empty scopes", async () => {
    const mock = fetchMock.sandbox().patchOnce(
      "https://api.github.com/applications/0123/token",
      {
        id: 2,
        token: "token456",
        scopes: null,
      },
      {
        headers: {
          authorization:
            "basic " + Buffer.from("0123:0123secret").toString("base64"),
        },
        body: {
          access_token: "token123",
        },
      }
    );

    const Mocktokit = OAuthAppOctokit.defaults({
      request: {
        fetch: mock,
      },
    });

    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      Octokit: Mocktokit,
    });

    const onTokenCallback = jest.fn();
    app.on("token.reset", onTokenCallback);

    const result = await app.resetToken({
      token: "token123",
    });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "authentication": Object {
          "clientId": "0123",
          "clientSecret": "0123secret",
          "clientType": "oauth-app",
          "scopes": null,
          "token": "token456",
        },
        "data": Object {
          "id": 2,
          "scopes": null,
          "token": "token456",
        },
        "headers": Object {
          "content-length": "41",
          "content-type": "application/json",
        },
        "status": 200,
        "url": "https://api.github.com/applications/0123/token",
      }
    `);
    expect(onTokenCallback.mock.calls.length).toEqual(1);
    const [context] = onTokenCallback.mock.calls[0];

    expect(context).toMatchObject({
      name: "token",
      action: "reset",
      token: "token456",
    });
    expect(context.octokit).toBeInstanceOf(Mocktokit);
  });

  it("app.deleteToken(options)", async () => {
    const mock = fetchMock
      .sandbox()
      .deleteOnce("https://api.github.com/applications/0123/token", 204, {
        headers: {
          authorization:
            "basic " + Buffer.from("0123:0123secret").toString("base64"),
        },
        body: {
          access_token: "token123",
        },
      });

    const Mocktokit = OAuthAppOctokit.defaults({
      request: {
        fetch: mock,
      },
    });

    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      Octokit: Mocktokit,
    });

    const onTokenCallback = jest.fn();
    app.on(["token.before_deleted", "token.deleted"], onTokenCallback);

    const result = await app.deleteToken({
      token: "token123",
    });

    expect(result).toBeUndefined();

    expect(onTokenCallback.mock.calls.length).toEqual(2);
    const [context_before_deleted] = onTokenCallback.mock.calls[0];
    const [context_deleted] = onTokenCallback.mock.calls[1];

    expect(context_before_deleted).toMatchObject({
      name: "token",
      action: "before_deleted",
      token: "token123",
    });
    expect(context_before_deleted.octokit).toBeInstanceOf(Mocktokit);

    expect(context_deleted).toMatchObject({
      name: "token",
      action: "deleted",
      token: "token123",
    });
    expect(context_deleted.octokit).toBeInstanceOf(Mocktokit);
  });

  it("app.deleteAuthorization(options)", async () => {
    const mock = fetchMock
      .sandbox()
      .deleteOnce("https://api.github.com/applications/0123/grant", 204, {
        headers: {
          authorization:
            "basic " + Buffer.from("0123:0123secret").toString("base64"),
        },
        body: {
          access_token: "token123",
        },
      });

    const Mocktokit = OAuthAppOctokit.defaults({
      request: {
        fetch: mock,
      },
    });

    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      Octokit: Mocktokit,
    });

    const onTokenCallback = jest.fn();
    app.on(["token", "authorization"], onTokenCallback);

    const result = await app.deleteAuthorization({
      token: "token123",
    });

    expect(result).toBeUndefined();

    expect(onTokenCallback.mock.calls.length).toEqual(4);
    const [
      context_authorization_before_deleted,
    ] = onTokenCallback.mock.calls[0];
    const [context_token_before_deleted] = onTokenCallback.mock.calls[1];
    const [context_token_deleted] = onTokenCallback.mock.calls[2];
    const [context_authorization_deleted] = onTokenCallback.mock.calls[3];

    expect(context_authorization_before_deleted).toMatchObject({
      name: "authorization",
      action: "before_deleted",
      token: "token123",
    });
    expect(context_authorization_before_deleted.octokit).toBeInstanceOf(
      Mocktokit
    );

    expect(context_token_before_deleted).toMatchObject({
      name: "token",
      action: "before_deleted",
      token: "token123",
    });
    expect(context_token_before_deleted.octokit).toBeInstanceOf(Mocktokit);

    expect(context_token_deleted).toMatchObject({
      name: "token",
      action: "deleted",
      token: "token123",
    });
    expect(context_token_deleted.octokit).toBeInstanceOf(Mocktokit);

    expect(context_authorization_deleted).toMatchObject({
      name: "authorization",
      action: "deleted",
      token: "token123",
    });
    expect(context_authorization_deleted.octokit).toBeInstanceOf(Mocktokit);
  });

  it("app.on multiple events", async () => {
    const mock = fetchMock
      .sandbox()
      .postOnce(
        "https://github.com/login/oauth/access_token",
        {
          access_token: "token123",
          scope: "repo,gist",
          token_type: "bearer",
        },
        {
          body: {
            client_id: "0123",
            client_secret: "0123secret",
            code: "code123",
            state: "state123",
          },
        }
      )
      .getOnce(
        "https://api.github.com/user",
        { login: "octocat" },
        {
          headers: {
            authorization: "token token123",
          },
        }
      );

    const Mocktokit = OAuthAppOctokit.defaults({
      request: {
        fetch: mock,
      },
    });

    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      Octokit: Mocktokit,
    });

    const calls: number[] = [];

    const onTokenCallback1 = jest.fn().mockImplementationOnce((context) => {
      calls.push(1);
      return new Promise((resolve) => setTimeout(resolve, 20));
    });

    const onTokenCallback2 = jest.fn().mockImplementationOnce((context) => {
      calls.push(2);
      return new Promise((resolve) => setTimeout(resolve, 10));
    });
    app.on("token.created", onTokenCallback1);
    app.on("token.created", onTokenCallback2);

    await app.exchangeWebFlowCode({
      state: "state123",
      code: "code123",
    });

    expect(calls).toStrictEqual([1, 2]);
  });
});
