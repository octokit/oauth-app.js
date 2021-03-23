import fetchMock, { MockMatcherFunction } from "fetch-mock";
import { Octokit } from "@octokit/core";

import { OAuthApp } from "../src";
import { OAuthAppOctokit } from "../src/oauth-app-octokit";

describe("app", () => {
  it("app.getUserOctokit(options)", async () => {
    const mock = fetchMock
      .sandbox()
      .postOnce(
        "https://github.com/login/oauth/access_token",
        {
          access_token: "token123",
          scope: "",
          token_type: "bearer",
        },
        {
          body: {
            client_id: "0123",
            client_secret: "0123secret",
            code: "code123",
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

    const octokit = await app.getUserOctokit({
      code: "code123",
    });
    expect(octokit).toBeInstanceOf(Octokit);

    const {
      data: { login },
    } = await octokit.request("GET /user");
    expect(login).toEqual("octocat");
  });

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

  it("app.createToken(options) for web flow", async () => {
    const mock = fetchMock
      .sandbox()
      .postOnce(
        "https://github.com/login/oauth/access_token",
        {
          access_token: "token123",
          scope: "repo gist",
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

    const result = await app.createToken({
      state: "state123",
      code: "code123",
    });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "clientId": "0123",
        "clientSecret": "0123secret",
        "clientType": "oauth-app",
        "scopes": Array [
          "repo",
          "gist",
        ],
        "token": "token123",
        "tokenType": "oauth",
        "type": "token",
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

  it("app.createToken(options) for device flow", async () => {
    const mock = fetchMock
      .sandbox()

      .postOnce(
        "https://github.com/login/device/code",
        {
          device_code: "devicecode123",
          user_code: "usercode123",
          verification_uri: "https://github.com/login/device",
          expires_in: 900,
          interval: 5,
        },
        {
          body: {
            client_id: "1234567890abcdef1234",
            scope: "repo gist",
          },
        }
      )
      .postOnce(
        "https://github.com/login/oauth/access_token",
        {
          access_token: "token123",
          scope: "repo gist",
        },
        {
          body: {
            client_id: "1234567890abcdef1234",
            device_code: "devicecode123",
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          },
        }
      );

    const Mocktokit = OAuthAppOctokit.defaults({
      request: {
        fetch: mock,
      },
    });

    const app = new OAuthApp({
      clientId: "1234567890abcdef1234",
      clientSecret: "1234567890abcdef1234567890abcdef12345678",
      Octokit: Mocktokit,
    });

    const onTokenCallback = jest.fn();
    app.on("token.created", onTokenCallback);

    const onVerification = jest.fn();
    const result = await app.createToken({
      onVerification,
      scopes: ["repo", "gist"],
    });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "clientId": "1234567890abcdef1234",
        "clientSecret": "1234567890abcdef1234567890abcdef12345678",
        "clientType": "oauth-app",
        "scopes": Array [
          "repo",
          "gist",
        ],
        "token": "token123",
        "tokenType": "oauth",
        "type": "token",
      }
    `);

    expect(onTokenCallback.mock.calls.length).toEqual(1);
    const [context] = onTokenCallback.mock.calls[0];

    expect(context).toMatchObject({
      token: "token123",
      scopes: ["repo", "gist"],
    });
    expect(context.octokit).toBeInstanceOf(Mocktokit);
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
    app.on("token.deleted", onTokenCallback);

    const result = await app.deleteToken({
      token: "token123",
    });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": undefined,
        "headers": Object {},
        "status": 204,
        "url": "https://api.github.com/applications/0123/token",
      }
    `);

    expect(onTokenCallback.mock.calls.length).toEqual(1);
    const [context_deleted] = onTokenCallback.mock.calls[0];

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

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": undefined,
        "headers": Object {},
        "status": 204,
        "url": "https://api.github.com/applications/0123/grant",
      }
    `);

    expect(onTokenCallback.mock.calls.length).toEqual(2);
    const [context_token_deleted] = onTokenCallback.mock.calls[0];
    const [context_authorization_deleted] = onTokenCallback.mock.calls[1];

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

  it('app.on("token.created", ({ octokit }) => octokit.auth({ type: "reset" })', async () => {
    const mock = fetchMock
      .sandbox()
      .postOnce(
        "https://github.com/login/oauth/access_token",
        {
          access_token: "token123",
          scope: "",
          token_type: "bearer",
        },
        {
          body: {
            client_id: "0123",
            client_secret: "0123secret",
            code: "code123",
          },
        }
      )
      .deleteOnce((url, options) => {
        expect(url).toEqual("https://api.github.com/applications/0123/token");
        // @ts-expect-error options.headers is not guaranteed to exist
        expect(options.headers.authorization).toEqual(
          "basic " + Buffer.from("0123:0123secret").toString("base64")
        );
        return true;
      }, {});

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

    app.on("token.created", async ({ octokit, authentication }) => {
      expect(authentication).toMatchInlineSnapshot(`
        Object {
          "clientId": "0123",
          "clientSecret": "0123secret",
          "clientType": "oauth-app",
          "scopes": Array [],
          "token": "token123",
          "tokenType": "oauth",
          "type": "token",
        }
      `);
      await octokit.auth({ type: "delete" });
    });

    await app.createToken({ code: "code123" });

    expect(mock.done()).toEqual(true);
  });

  it("app.on multiple events", async () => {
    const mock = fetchMock
      .sandbox()
      .postOnce(
        "https://github.com/login/oauth/access_token",
        {
          access_token: "token123",
          scope: "repo gist",
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

    await app.createToken({
      state: "state123",
      code: "code123",
    });

    expect(calls).toStrictEqual([1, 2]);
  });
});
