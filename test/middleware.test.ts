import { createServer } from "http";

import { request } from "@octokit/request";

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

    const { data } = await request(
      `http://localhost:${port}/api/github/oauth/octokit.js`
    );

    expect(data).toMatch(/Core.defaults/);

    server.close();
  });
});
