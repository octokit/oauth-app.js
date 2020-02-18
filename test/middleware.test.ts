import { createServer } from "http";
import { URL } from "url";

import fetch from "node-fetch";
import fetchMock from "fetch-mock";
import { OAuthAppOctokit } from "../src/oauth-app-octokit";

import { OAuthApp } from "../src";

describe("app.middleware", () => {
  it("GET /api/github/oauth/octokit.js", async () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret"
    });

    const server = createServer(app.middleware).listen();
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

    const server = createServer(app.middleware).listen();
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

    const server = createServer(app.middleware).listen();
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
    const mock = fetchMock
      .sandbox()
      .postOnce(
        "https://github.com/login/oauth/access_token",
        {
          access_token: "token123",
          scope: "",
          token_type: "bearer"
        },
        {
          body: {
            client_id: "0123",
            client_secret: "0123secret",
            code: "012345",
            state: "state123"
          }
        }
      )
      .getOnce(
        "https://api.github.com/user",
        { login: "octocat" },
        {
          headers: {
            authorization: "token token123"
          }
        }
      );

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
    app.onToken(onTokenCallback);

    const server = createServer(app.middleware).listen();
    // @ts-ignore complains about { port } although it's included in returned AddressInfo interface
    const { port } = server.address();

    const response = await fetch(
      `http://localhost:${port}/api/github/oauth/callback?code=012345&state=state123`
    );

    server.close();

    expect(response.status).toEqual(200);
    expect(onTokenCallback.mock.calls.length).toEqual(1);
    const [context] = onTokenCallback.mock.calls[0];

    expect(context).toMatchObject({
      token: "token123",
      scopes: []
    });
    expect(context.octokit).toBeInstanceOf(Mocktokit);

    const { data } = await context.octokit.request("GET /user");
    expect(data.login).toEqual("octocat");
  });

  it("POST /api/github/oauth/token", async () => {
    const mock = fetchMock.sandbox().postOnce(
      "https://github.com/login/oauth/access_token",
      {
        access_token: "token123",
        scope: "",
        token_type: "bearer"
      },
      {
        body: {
          client_id: "0123",
          client_secret: "0123secret",
          code: "012345",
          state: "state123"
        }
      }
    );

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
    app.onToken(onTokenCallback);

    const server = createServer(app.middleware).listen();
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
    expect(onTokenCallback.mock.calls.length).toEqual(1);
    const [context] = onTokenCallback.mock.calls[0];

    expect(context).toMatchObject({
      token: "token123",
      scopes: []
    });
  });
});
