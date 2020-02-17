import { createServer } from "http";

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
    expect(headers.get("location")).toMatch(
      /^https:\/\/github.com\/login\/oauth\/authorize\?allow_signup=true&client_id=0123&state=\w+$/
    );
  });
});
