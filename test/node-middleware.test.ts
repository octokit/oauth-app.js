import { createServer } from "http";
import { URL } from "url";

import fetch from "node-fetch";
import { OAuthApp, getNodeMiddleware } from "../src/";

describe("getNodeMiddleware(app)", () => {
  it("GET /api/github/oauth/octokit.js", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret"
    });

    const server = createServer(getNodeMiddleware(app)).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/octokit.js`
    );

    server.close();

    expect(await response.text()).toMatch(/Core.defaults/);
  });

  it("GET /api/github/oauth/login", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret"
    });

    const server = createServer(getNodeMiddleware(app)).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login`,
      {
        redirect: "manual"
      }
    );

    server.close();

    expect(status).toEqual(302);

    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize"
    });
    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("scope")).toEqual(null);
  });

  it("GET /api/github/oauth/login?state=mystate123&scopes=one,two,three", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret"
    });

    const server = createServer(getNodeMiddleware(app)).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const { status, headers } = await fetch(
      `http://localhost:${port}/api/github/oauth/login?state=mystate123&scopes=one,two,three`,
      {
        redirect: "manual"
      }
    );

    server.close();

    expect(status).toEqual(302);

    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize"
    });

    expect(url.searchParams.get("client_id")).toEqual("0123");
    expect(url.searchParams.get("state")).toEqual("mystate123");
    expect(url.searchParams.get("scope")).toEqual("one,two,three");
  });

  it("GET /api/github/oauth/callback?code=012345&state=mystate123", async () => {
    const appMock = {
      createToken: jest.fn().mockResolvedValue({ token: "token123" })
    };

    const server = createServer(
      getNodeMiddleware((appMock as unknown) as OAuthApp)
    ).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/callback?code=012345&state=state123`
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(await response.text()).toMatch(/token123/);

    expect(appMock.createToken.mock.calls.length).toEqual(1);
    expect(appMock.createToken.mock.calls[0][0]).toStrictEqual({
      state: "state123",
      code: "012345"
    });
  });

  it("POST /api/github/oauth/token", async () => {
    const appMock = {
      createToken: jest
        .fn()
        .mockResolvedValue({ token: "token123", scopes: ["repo", "gist"] })
    };

    const server = createServer(
      getNodeMiddleware((appMock as unknown) as OAuthApp)
    ).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "POST",
        body: JSON.stringify({
          code: "012345",
          state: "state123"
        })
      }
    );

    server.close();

    expect(response.status).toEqual(201);
    expect(await response.json()).toStrictEqual({
      token: "token123",
      scopes: ["repo", "gist"]
    });

    expect(appMock.createToken.mock.calls.length).toEqual(1);
    expect(appMock.createToken.mock.calls[0][0]).toStrictEqual({
      state: "state123",
      code: "012345"
    });
  });

  it("GET /api/github/oauth/token", async () => {
    const appMock = {
      checkToken: jest.fn().mockResolvedValue({ id: 1 })
    };

    const server = createServer(
      getNodeMiddleware((appMock as unknown) as OAuthApp)
    ).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        headers: {
          authorization: "token token123"
        }
      }
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(await response.json()).toStrictEqual({ id: 1 });

    expect(appMock.checkToken.mock.calls.length).toEqual(1);
    expect(appMock.checkToken.mock.calls[0][0]).toStrictEqual({
      token: "token123"
    });
  });

  it("PATCH /api/github/oauth/token", async () => {
    const appMock = {
      resetToken: jest.fn().mockResolvedValue({
        id: 2,
        token: "token456",
        scopes: ["repo", "gist"]
      })
    };

    const server = createServer(
      getNodeMiddleware((appMock as unknown) as OAuthApp)
    ).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "PATCH",
        headers: {
          authorization: "token token123"
        }
      }
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(await response.json()).toStrictEqual({
      id: 2,
      token: "token456",
      scopes: ["repo", "gist"]
    });

    expect(appMock.resetToken.mock.calls.length).toEqual(1);
    expect(appMock.resetToken.mock.calls[0][0]).toStrictEqual({
      token: "token123"
    });
  });

  it("DELETE /api/github/oauth/token", async () => {
    const appMock = {
      deleteToken: jest.fn().mockResolvedValue(undefined)
    };

    const server = createServer(
      getNodeMiddleware((appMock as unknown) as OAuthApp)
    ).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/token`,
      {
        method: "DELETE",
        headers: {
          authorization: "token token123"
        }
      }
    );

    server.close();

    expect(response.status).toEqual(204);

    expect(appMock.deleteToken.mock.calls.length).toEqual(1);
    expect(appMock.deleteToken.mock.calls[0][0]).toStrictEqual({
      token: "token123"
    });
  });

  it("DELETE /api/github/oauth/grant", async () => {
    const appMock = {
      deleteAuthorization: jest.fn().mockResolvedValue(undefined)
    };

    const server = createServer(
      getNodeMiddleware((appMock as unknown) as OAuthApp)
    ).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/grant`,
      {
        method: "DELETE",
        headers: {
          authorization: "token token123"
        }
      }
    );

    server.close();

    expect(response.status).toEqual(204);

    expect(appMock.deleteAuthorization.mock.calls.length).toEqual(1);
    expect(appMock.deleteAuthorization.mock.calls[0][0]).toStrictEqual({
      token: "token123"
    });
  });

    expect(context_deleted).toStrictEqual({
      name: "token",
      action: "deleted",
      token: "token123"
    });
  });

  it("DELETE /api/github/oauth/grant", async () => {
    const mock = fetchMock
      .sandbox()
      .deleteOnce("https://api.github.com/applications/0123/grant", 204, {
        headers: {
          authorization:
            "basic " + Buffer.from("0123:0123secret").toString("base64")
        },
        body: {
          access_token: "token123"
        }
      });

    const Mocktokit = OAuthAppOctokit.defaults({
      request: {
        fetch: mock
      }
    });

    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
      Octokit: Mocktokit
    });

    const onTokenCallback = jest.fn();
    app.on(["token", "authorization"], onTokenCallback);

    const server = createServer(app.middleware).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/grant`,
      {
        method: "DELETE",
        headers: {
          authorization: "token token123"
        }
      }
    );

    server.close();

    expect(response.status).toEqual(204);

    expect(onTokenCallback.mock.calls.length).toEqual(4);
    const [
      context_authorization_before_deleted
    ] = onTokenCallback.mock.calls[0];
    const [context_token_before_deleted] = onTokenCallback.mock.calls[1];
    const [context_token_deleted] = onTokenCallback.mock.calls[2];
    const [context_authorization_deleted] = onTokenCallback.mock.calls[3];

    expect(context_authorization_before_deleted).toMatchObject({
      name: "authorization",
      action: "before_deleted",
      token: "token123"
    });
    expect(context_authorization_before_deleted.octokit).toBeInstanceOf(
      Mocktokit
    );

    expect(context_token_before_deleted).toMatchObject({
      name: "token",
      action: "before_deleted",
      token: "token123"
    });
    expect(context_token_before_deleted.octokit).toBeInstanceOf(Mocktokit);

    expect(context_token_deleted).toStrictEqual({
      name: "token",
      action: "deleted",
      token: "token123"
    });
    expect(context_authorization_deleted).toStrictEqual({
      name: "authorization",
      action: "deleted",
      token: "token123"
    });
  });
});
