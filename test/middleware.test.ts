import { createServer } from "http";
import { URL } from "url";

import fetch from "node-fetch";

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
});
