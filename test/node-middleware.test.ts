import { createServer, IncomingMessage } from "node:http";
import { URL } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { createNodeMiddleware, OAuthApp } from "../src/index.ts";

// import without types
// @ts-ignore
const express = (await import("express")).default as any;

describe("createNodeMiddleware(app)", () => {
  it("allow pre-flight requests", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      { method: "OPTIONS" },
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(response.headers.get("access-control-allow-origin")).toEqual("*");
    expect(response.headers.get("access-control-allow-methods")).toEqual("*");
    expect(response.headers.get("access-control-allow-headers")).toEqual(
      "Content-Type, User-Agent, Authorization",
    );
  });

  it("doesn't overwrite pre-flight requests unrelated to github oauth", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });

    const server = createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "http://localhost:8080",
        });
        res.end("OK");
        return;
      }
      createNodeMiddleware(app);
    }).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(`http://localhost:${port}/health`, {
      method: "OPTIONS",
    });

    server.close();

    expect(response.status).toEqual(200);
    expect(response.headers.get("access-control-allow-origin")).toEqual(
      "http://localhost:8080",
    );
    expect(response.headers.get("access-control-allow-methods")).toEqual(null);
    expect(response.headers.get("access-control-allow-headers")).toEqual(null);
  });

  it("GET /api/github/oauth/login", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login`,
      {
        redirect: "manual",
      },
    );

    server.close();

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

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login`,
      {
        redirect: "manual",
      },
    );

    server.close();

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

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login?state=mystate123&scopes=one,two,three`,
      {
        redirect: "manual",
      },
    );

    server.close();

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
      createToken: vi.fn<any>().mockResolvedValue({
        authentication: {
          type: "token",
          tokenType: "oauth",
          token: "token123",
        },
      }),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/callback?code=012345&state=state123`,
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(await response.text()).toMatch(/token123/);

    expect(appMock.createToken.mock.calls.length).toEqual(1);
    expect(appMock.createToken.mock.calls[0][0]).toEqual({
      code: "012345",
    });
  });

  it("POST /api/github/oauth/token", async () => {
    const appMock = {
      createToken: vi.fn<any>().mockResolvedValue({
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "POST",
        body: JSON.stringify({
          code: "012345",
          redirectUrl: "http://example.com",
        }),
      },
    );

    server.close();

    expect(response.status).toEqual(201);
    expect(await response.json()).toEqual({
      authentication: { type: "token", tokenType: "oauth" },
    });

    expect(appMock.createToken.mock.calls.length).toEqual(1);
    expect(appMock.createToken.mock.calls[0][0]).toEqual({
      code: "012345",
      redirectUrl: "http://example.com",
    });
  });

  it("GET /api/github/oauth/token", async () => {
    const appMock = {
      checkToken: vi.fn<any>().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        headers: {
          authorization: "token token123",
        },
      },
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({
      data: { id: 1 },
      authentication: { type: "token", tokenType: "oauth" },
    });

    expect(appMock.checkToken.mock.calls.length).toEqual(1);
    expect(appMock.checkToken.mock.calls[0][0]).toEqual({
      token: "token123",
    });
  });

  it("PATCH /api/github/oauth/token", async () => {
    const appMock = {
      resetToken: vi.fn<any>().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "PATCH",
        headers: {
          authorization: "token token123",
        },
      },
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({
      data: { id: 1 },
      authentication: { type: "token", tokenType: "oauth" },
    });

    expect(appMock.resetToken.mock.calls.length).toEqual(1);
    expect(appMock.resetToken.mock.calls[0][0]).toEqual({
      token: "token123",
    });
  });

  it("POST /api/github/oauth/token/scoped", async () => {
    const appMock = {
      scopeToken: vi.fn<any>().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token/scoped`,
      {
        method: "POST",
        headers: {
          authorization: "token token123",
        },
        body: JSON.stringify({
          target: "octokit",
          repositories: ["oauth-methods.js"],
          permissions: { issues: "write" },
        }),
      },
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(await response.json()).toMatchInlineSnapshot(`
    {
      "authentication": {
        "tokenType": "oauth",
        "type": "token",
      },
      "data": {
        "id": 1,
      },
    }
    `);

    expect(appMock.scopeToken.mock.calls.length).toEqual(1);
    expect(appMock.scopeToken.mock.calls[0][0]).toMatchInlineSnapshot(`
      {
        "permissions": {
          "issues": "write",
        },
        "repositories": [
          "oauth-methods.js",
        ],
        "target": "octokit",
        "token": "token123",
      }
    `);
  });

  it("PATCH /api/github/oauth/refresh-token", async () => {
    const appMock = {
      refreshToken: vi.fn<any>().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/refresh-token`,
      {
        method: "PATCH",
        headers: {
          authorization: "token token123",
        },
        body: JSON.stringify({
          refreshToken: "r1.refreshtoken123",
        }),
      },
    );

    server.close();

    expect(await response.json()).toEqual({
      data: { id: 1 },
      authentication: { type: "token", tokenType: "oauth" },
    });
    expect(response.status).toEqual(200);

    expect(appMock.refreshToken.mock.calls.length).toEqual(1);
    expect(appMock.refreshToken.mock.calls[0][0]).toEqual({
      refreshToken: "r1.refreshtoken123",
    });
  });
  it("PATCH /api/github/oauth/token", async () => {
    const appMock = {
      resetToken: vi.fn<any>().mockResolvedValue({
        data: { id: 1 },
        authentication: {
          type: "token",
          tokenType: "oauth",
          clientSecret: "secret123",
        },
      }),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "PATCH",
        headers: {
          authorization: "token token123",
        },
      },
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({
      data: { id: 1 },
      authentication: { type: "token", tokenType: "oauth" },
    });

    expect(appMock.resetToken.mock.calls.length).toEqual(1);
    expect(appMock.resetToken.mock.calls[0][0]).toEqual({
      token: "token123",
    });
  });

  it("DELETE /api/github/oauth/token", async () => {
    const appMock = {
      deleteToken: vi.fn<any>().mockResolvedValue(undefined),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "DELETE",
        headers: {
          authorization: "token token123",
        },
      },
    );

    server.close();

    expect(response.status).toEqual(204);

    expect(appMock.deleteToken.mock.calls.length).toEqual(1);
    expect(appMock.deleteToken.mock.calls[0][0]).toEqual({
      token: "token123",
    });
  });

  it("DELETE /api/github/oauth/grant", async () => {
    const appMock = {
      deleteAuthorization: vi.fn<any>().mockResolvedValue(undefined),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/grant`,
      {
        method: "DELETE",
        headers: {
          authorization: "token token123",
        },
      },
    );

    server.close();

    expect(response.status).toEqual(204);

    expect(appMock.deleteAuthorization.mock.calls.length).toEqual(1);
    expect(appMock.deleteAuthorization.mock.calls[0][0]).toEqual({
      token: "token123",
    });
  });

  it("GET /unknown", async () => {
    const appMock = {};

    const middleware = createNodeMiddleware(appMock as unknown as OAuthApp);
    const requestListener = async (req: IncomingMessage, res: any) => {
      if (!(await middleware(req, res))) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.write("Not found.");
        res.end();
      }
    };
    const server = createServer(requestListener).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(`http://localhost:${port}/unknown`);

    server.close();

    expect(response.status).toEqual(404);
  });

  it("GET /api/github/oauth/callback without code", async () => {
    const appMock = {};

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/callback`,
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: '[@octokit/oauth-app] "code" parameter is required',
    });
  });

  it("GET /api/github/oauth/callback with error", async () => {
    const appMock = {};

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/callback?error=redirect_uri_mismatch&error_description=The+redirect_uri+MUST+match+the+registered+callback+URL+for+this+application.&error_uri=https://docs.github.com/en/developers/apps/troubleshooting-authorization-request-errors/%23redirect-uri-mismatch&state=xyz`,
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error:
        "[@octokit/oauth-app] redirect_uri_mismatch The redirect_uri MUST match the registered callback URL for this application.",
    });
  });

  it("POST /api/github/oauth/token without state or code", async () => {
    const appMock = {};

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: '[@octokit/oauth-app] "code" parameter is required',
    });
  });

  it("POST /api/github/oauth/token with non-JSON request body", async () => {
    const appMock = {};

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "POST",
        body: "foo",
      },
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: "[@octokit/oauth-app] request error",
    });
  });

  it("GET /api/github/oauth/token without Authorization header", async () => {
    const appMock = {};

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        headers: {},
      },
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("PATCH /api/github/oauth/token without authorization header", async () => {
    const appMock = {};

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "PATCH",
        headers: {},
      },
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("POST /api/github/oauth/token/scoped without authorization header", async () => {
    const appMock = {};

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token/scoped`,
      {
        method: "POST",
        headers: {},
      },
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("PATCH /api/github/oauth/refresh-token without authorization header", async () => {
    const appMock = {
      refreshToken: vi.fn<any>().mockResolvedValue({
        ok: true,
      }),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/refresh-token`,
      {
        method: "PATCH",
        body: JSON.stringify({
          refreshToken: "r1.refreshtoken123",
        }),
      },
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("PATCH /api/github/oauth/refresh-token without refreshToken", async () => {
    const appMock = {
      refreshToken: vi.fn<any>().mockResolvedValue({
        ok: true,
      }),
    };

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/refresh-token`,
      {
        method: "PATCH",
        headers: {
          authorization: "token token123",
        },
      },
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: "[@octokit/oauth-app] refreshToken must be sent in request body",
    });
  });

  it("DELETE /api/github/oauth/token without authorization header", async () => {
    const appMock = {};

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "DELETE",
        headers: {},
      },
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("DELETE /api/github/oauth/grant without authorization header", async () => {
    const appMock = {};

    const server = createServer(
      createNodeMiddleware(appMock as unknown as OAuthApp),
    ).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/grant`,
      {
        method: "DELETE",
        headers: {},
      },
    );

    server.close();

    expect(response.status).toEqual(400);
    expect(await response.json()).toEqual({
      error: '[@octokit/oauth-app] "Authorization" header is required',
    });
  });

  it("express middleware no mount path 404", async () => {
    const expressApp = express();

    expressApp.use(
      createNodeMiddleware(
        new OAuthApp({
          clientId: "0123",
          clientSecret: "0123secret",
        }),
      ),
    );
    expressApp.all("*", (_request: any, response: any) =>
      response.status(404).send("Nope"),
    );

    const server = expressApp.listen();

    const { port } = server.address();

    const response = await fetch(`http://localhost:${port}/test`, {
      method: "POST",
      body: "{}",
    });

    await expect(response.text()).resolves.toBe("Nope");
    expect(response.status).toEqual(404);

    server.close();
  });

  it("???", async () => {
    const app = express();

    // app.all("/foo", (_request: any, response: any) => response.end("ok\n"));
    app.use(
      createNodeMiddleware(
        new OAuthApp({
          clientId: "0123",
          clientSecret: "0123secret",
        }),
      ),
    );

    const server = app.listen();

    const { port } = server.address();

    const response = await fetch(`http://localhost:${port}/test`, {
      method: "POST",
      body: "{}",
    });

    await expect(response.text()).resolves.toContain("Cannot POST /test");
    expect(response.status).toEqual(404);

    // const responseForFoo = await fetch(`http://localhost:${port}/foo`, {
    //   method: "POST",
    //   body: "{}",
    // });

    // await expect(responseForFoo.text()).resolves.toContain("ok\n");
    // expect(responseForFoo.status).toEqual(200);

    server.close();
  });

  it("express middleware no mount path no next", async () => {
    const app = express();

    app.all("/foo", (_request: any, response: any) => response.end("ok\n"));
    app.use(
      createNodeMiddleware(
        new OAuthApp({
          clientId: "0123",
          clientSecret: "0123secret",
        }),
      ),
    );

    const server = app.listen();

    const { port } = server.address();

    const response = await fetch(`http://localhost:${port}/test`, {
      method: "POST",
      body: "{}",
    });

    await expect(response.text()).resolves.toContain("Cannot POST /test");
    expect(response.status).toEqual(404);

    const responseForFoo = await fetch(`http://localhost:${port}/foo`, {
      method: "POST",
      body: "{}",
    });

    await expect(responseForFoo.text()).resolves.toContain("ok\n");
    expect(responseForFoo.status).toEqual(200);

    server.close();
  });

  it("express middleware no mount path with options.pathPrefix", async () => {
    const app = express();

    app.use(
      createNodeMiddleware(
        new OAuthApp({
          clientId: "0123",
          clientSecret: "0123secret",
        }),
        { pathPrefix: "/test" },
      ),
    );
    app.all("*", (_request: any, response: any) =>
      response.status(404).send("Nope"),
    );

    const server = app.listen();

    const { port } = server.address();

    const { status } = await fetch(`http://localhost:${port}/test/login`, {
      redirect: "manual",
    });

    server.close();

    expect(status).toEqual(302);
  });

  it("express middleware with mount path with options.pathPrefix", async () => {
    const app = express();

    app.use(
      "/test",
      createNodeMiddleware(
        new OAuthApp({
          clientId: "0123",
          clientSecret: "0123secret",
        }),
        { pathPrefix: "/test" },
      ),
    );
    app.all("*", (_request: any, response: any) =>
      response.status(404).send("Nope"),
    );

    const server = app.listen();

    const { port } = server.address();

    const { status } = await fetch(`http://localhost:${port}/test/test/login`, {
      redirect: "manual",
    });

    server.close();

    expect(status).toEqual(302);
  });

  it("GET /api/github/oauth/login with allowSignup set to false", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      allowSignup: false,
    });

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login`,
      {
        redirect: "manual",
      },
    );

    server.close();

    expect(status).toEqual(302);

    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("allow_signup")).toEqual("false");
  });

  it("GET /api/github/oauth/login?allowSignup=false with allowSignup not set", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login?allowSignup=false`,
      {
        redirect: "manual",
      },
    );

    server.close();

    expect(status).toEqual(302);

    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("allow_signup")).toEqual("false");
  });

  it("GET /api/github/oauth/login?allowSignup=false with allowSignup set to true", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      allowSignup: true,
    });

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login?allowSignup=false`,
      {
        redirect: "manual",
      },
    );

    server.close();

    expect(status).toEqual(302);

    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("allow_signup")).toEqual("true");
  });

  it("GET /api/github/oauth/login with allowSignup not set", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login`,
      {
        redirect: "manual",
      },
    );

    server.close();

    expect(status).toEqual(302);

    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("allow_signup")).toEqual("true");
  });

  it("GET /api/github/oauth/login?redirectUrl=http://localhost:12345 with redirectUrl option not set", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login?redirectUrl=http://localhost:12345`,
      {
        redirect: "manual",
      },
    );

    server.close();

    expect(status).toEqual(302);

    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("redirect_uri")).toEqual(
      "http://localhost:12345",
    );
  });

  it("GET /api/github/oauth/login with redirectUrl option set to http://localhost:1234", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      redirectUrl: "http://localhost:12345",
    });

    const server = createServer(createNodeMiddleware(app)).listen();
    // @ts-expect-error complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login`,
      {
        redirect: "manual",
      },
    );

    server.close();

    expect(status).toEqual(302);

    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("redirect_uri")).toEqual(
      "http://localhost:12345",
    );
  });
});
