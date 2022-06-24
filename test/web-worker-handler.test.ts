import { URL } from "url";
import * as nodeFetch from "node-fetch";
import fromEntries from "fromentries";
import {
  createCloudflareHandler,
  createWebWorkerHandler,
  OAuthApp,
} from "../src";
import { Octokit } from "@octokit/core";

describe("createWebWorkerHandler(app)", () => {
  beforeAll(() => {
    Object.fromEntries ||= fromEntries;
    (global as any).Request = nodeFetch.Request;
    (global as any).Response = nodeFetch.Response;
  });

  afterAll(() => {
    delete (global as any).Request;
    delete (global as any).Response;
  });

  it("support both oauth-app and github-app", () => {
    const oauthApp = new OAuthApp({
      clientType: "oauth-app",
      clientId: "0123",
      clientSecret: "0123secret",
    });
    createWebWorkerHandler(oauthApp);

    const githubApp = new OAuthApp({
      clientType: "github-app",
      clientId: "0123",
      clientSecret: "0123secret",
    });
    createWebWorkerHandler(githubApp);
  });

  it("allow pre-flight requests", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });
    const handleRequest = createWebWorkerHandler(app);
    const request = new Request("/api/github/oauth/token", {
      method: "OPTIONS",
    });
    const response = await handleRequest(request);
    expect(response.status).toStrictEqual(200);
  });

  it("GET /api/github/oauth/login", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });
    const handleRequest = createWebWorkerHandler(app);

    const request = new Request("/api/github/oauth/login");
    const { status, headers } = await handleRequest(request);

    expect(status).toEqual(302);
    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("scope")).toEqual(null);
  });

  it("GET /api/github/oauth/login with defaultScopes (#110)", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      defaultScopes: ["repo"],
    });
    const handleRequest = createWebWorkerHandler(app);

    const request = new Request("/api/github/oauth/login");
    const { status, headers } = await handleRequest(request);

    expect(status).toEqual(302);
    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("scope")).toEqual("repo");
  });

  it("GET /api/github/oauth/login?state=mystate123&scopes=one,two,three", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });
    const handleRequest = createWebWorkerHandler(app);

    const request = new Request(
      "/api/github/oauth/login?state=mystate123&scopes=one,two,three"
    );
    const { status, headers } = await handleRequest(request);

    expect(status).toEqual(302);
    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toEqual("mystate123");
    expect(url.searchParams.get("scope")).toEqual("one,two,three");
  });

  it("GET /api/github/oauth/callback?code=012345&state=mystate123", async () => {
    const appMock = {
      createToken: jest.fn().mockResolvedValue({
        authentication: {
          type: "token",
          tokenType: "oauth",
          token: "token123",
        },
      }),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request(
      "/api/github/oauth/callback?code=012345&state=state123"
    );
    const response = await handleRequest(request);

    expect(response.status).toEqual(200);
    expect(await response.text()).toMatch(/token123/);

    expect(appMock.createToken.mock.calls.length).toEqual(1);
    expect(appMock.createToken.mock.calls[0][0]).toStrictEqual({
      code: "012345",
    });
  });

  it("POST /api/github/oauth/token", async () => {
    const appMock = {
      createToken: jest.fn().mockResolvedValue({
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      method: "POST",
      body: JSON.stringify({
        code: "012345",
        redirectUrl: "http://example.com",
      }),
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(201);
    expect(await response.json()).toStrictEqual({
      authentication: { type: "token", tokenType: "oauth" },
    });

    expect(appMock.createToken.mock.calls.length).toEqual(1);
    expect(appMock.createToken.mock.calls[0][0]).toStrictEqual({
      code: "012345",
      redirectUrl: "http://example.com",
    });
  });

  it("GET /api/github/oauth/token", async () => {
    const appMock = {
      checkToken: jest.fn().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      headers: {
        authorization: "token token123",
      },
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(200);
    expect(await response.json()).toStrictEqual({
      data: { id: 1 },
      authentication: { type: "token", tokenType: "oauth" },
    });

    expect(appMock.checkToken.mock.calls.length).toEqual(1);
    expect(appMock.checkToken.mock.calls[0][0]).toStrictEqual({
      token: "token123",
    });
  });

  it("PATCH /api/github/oauth/token", async () => {
    const appMock = {
      resetToken: jest.fn().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      method: "PATCH",
      headers: { authorization: "token token123" },
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(200);
    expect(await response.json()).toStrictEqual({
      data: { id: 1 },
      authentication: { type: "token", tokenType: "oauth" },
    });

    expect(appMock.resetToken.mock.calls.length).toEqual(1);
    expect(appMock.resetToken.mock.calls[0][0]).toStrictEqual({
      token: "token123",
    });
  });

  it("POST /api/github/oauth/token/scoped", async () => {
    const appMock = {
      scopeToken: jest.fn().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token/scoped", {
      method: "POST",
      headers: { authorization: "token token123" },
      body: JSON.stringify({
        target: "octokit",
        repositories: ["oauth-methods.js"],
        permissions: { issues: "write" },
      }),
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(200);
    expect(response.status).toEqual(200);
    expect(await response.json()).toMatchInlineSnapshot(`
      Object {
        "authentication": Object {
          "tokenType": "oauth",
          "type": "token",
        },
        "data": Object {
          "id": 1,
        },
      }
    `);

    expect(appMock.scopeToken.mock.calls.length).toEqual(1);
    expect(appMock.scopeToken.mock.calls[0][0]).toMatchInlineSnapshot(`
      Object {
        "permissions": Object {
          "issues": "write",
        },
        "repositories": Array [
          "oauth-methods.js",
        ],
        "target": "octokit",
        "token": "token123",
      }
    `);
  });

  it("PATCH /api/github/oauth/refresh-token", async () => {
    const appMock = {
      refreshToken: jest.fn().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/refresh-token", {
      method: "PATCH",
      headers: { authorization: "token token123" },
      body: JSON.stringify({ refreshToken: "r1.refreshtoken123" }),
    });
    const response = await handleRequest(request);

    expect(await response.json()).toStrictEqual({
      data: { id: 1 },
      authentication: { type: "token", tokenType: "oauth" },
    });
    expect(response.status).toEqual(200);

    expect(appMock.refreshToken.mock.calls.length).toEqual(1);
    expect(appMock.refreshToken.mock.calls[0][0]).toStrictEqual({
      refreshToken: "r1.refreshtoken123",
    });
  });

  it("PATCH /api/github/oauth/token", async () => {
    const appMock = {
      resetToken: jest.fn().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      method: "PATCH",
      headers: { authorization: "token token123" },
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(200);
    expect(await response.json()).toStrictEqual({
      data: { id: 1 },
      authentication: { type: "token", tokenType: "oauth" },
    });

    expect(appMock.resetToken.mock.calls.length).toEqual(1);
    expect(appMock.resetToken.mock.calls[0][0]).toStrictEqual({
      token: "token123",
    });
  });

  it("DELETE /api/github/oauth/token", async () => {
    const appMock = {
      deleteToken: jest.fn().mockResolvedValue(undefined),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      method: "DELETE",
      headers: { authorization: "token token123" },
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(204);

    expect(appMock.deleteToken.mock.calls.length).toEqual(1);
    expect(appMock.deleteToken.mock.calls[0][0]).toStrictEqual({
      token: "token123",
    });
  });

  it("DELETE /api/github/oauth/grant", async () => {
    const appMock = {
      deleteAuthorization: jest.fn().mockResolvedValue(undefined),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/grant", {
      method: "DELETE",
      headers: { authorization: "token token123" },
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(204);

    expect(appMock.deleteAuthorization.mock.calls.length).toEqual(1);
    expect(appMock.deleteAuthorization.mock.calls[0][0]).toStrictEqual({
      token: "token123",
    });
  });

  it("POST /unrelated", async () => {
    expect.assertions(4);

    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });
    const handleRequest = createWebWorkerHandler(app, {
      onUnhandledRequest: async (request: Request) => {
        expect(request.method).toEqual("POST");
        expect(request.url).toEqual("/unrelated");
        const text = await request.text();
        expect(text).toEqual('{"ok":true}');
        return new Response(null, { status: 200 });
      },
    });

    const request = new Request("/unrelated", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
      headers: {
        "content-type": "application/json",
      },
    });
    const { status } = await handleRequest(request);

    expect(status).toEqual(200);
  });

  // // errors

  it("GET /unknown", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/unknown");
    const response = await handleRequest(request);
    expect(response.status).toEqual(404);
  });

  it("GET /api/github/oauth/callback without code", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/callback");
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: '[@octokit/oauth-app] "code" parameter is required',
    });
  });

  it("GET /api/github/oauth/callback with error", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request(
      "/api/github/oauth/callback?error=redirect_uri_mismatch&error_description=The+redirect_uri+MUST+match+the+registered+callback+URL+for+this+application.&error_uri=https://docs.github.com/en/developers/apps/troubleshooting-authorization-request-errors/%23redirect-uri-mismatch&state=xyz"
    );
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error:
        "[@octokit/oauth-app] redirect_uri_mismatch The redirect_uri MUST match the registered callback URL for this application.",
    });
  });

  it("POST /api/github/oauth/token without state or code", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: '[@octokit/oauth-app] "code" parameter is required',
    });
  });

  it("POST /api/github/oauth/token with non-JSON request body", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      method: "POST",
      body: "foo",
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: "[@octokit/oauth-app] request error",
    });
  });

  it("GET /api/github/oauth/token without Authorization header", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      headers: {},
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("PATCH /api/github/oauth/token without authorization header", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      method: "PATCH",
      headers: {},
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("POST /api/github/oauth/token/scoped without authorization header", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token/scoped", {
      method: "POST",
      headers: {},
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("PATCH /api/github/oauth/refresh-token without authorization header", async () => {
    const appMock = {
      refreshToken: jest.fn().mockResolvedValue({
        ok: true,
      }),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/refresh-token", {
      method: "PATCH",
      body: JSON.stringify({
        refreshToken: "r1.refreshtoken123",
      }),
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("PATCH /api/github/oauth/refresh-token without refreshToken", async () => {
    const appMock = {
      refreshToken: jest.fn().mockResolvedValue({
        ok: true,
      }),
    };
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/refresh-token", {
      method: "PATCH",
      headers: {
        authorization: "token token123",
      },
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: "[@octokit/oauth-app] refreshToken must be sent in request body",
    });
  });

  it("DELETE /api/github/oauth/token without authorization header", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/token", {
      method: "DELETE",
      headers: {},
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("DELETE /api/github/oauth/grant without authorization header", async () => {
    const appMock = {};
    const handleRequest = createWebWorkerHandler(
      appMock as unknown as OAuthApp
    );

    const request = new Request("/api/github/oauth/grant", {
      method: "DELETE",
      headers: {},
    });
    const response = await handleRequest(request);

    expect(response.status).toEqual(400);
    expect(await response.json()).toStrictEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("web worker handler with options.pathPrefix", async () => {
    const handleRequest = createWebWorkerHandler(
      new OAuthApp({
        clientId: "0123",
        clientSecret: "0123secret",
      }),
      { pathPrefix: "/test" }
    );

    const request = new Request("/test/login", { redirect: "manual" });
    const { status } = await handleRequest(request);

    expect(status).toEqual(302);
  });
});
