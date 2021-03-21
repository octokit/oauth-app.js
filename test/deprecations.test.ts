import { getNodeMiddleware, OAuthApp } from "../src";

describe("deprecations", () => {
  it("getNodeMiddleware", () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret",
    });

    console.warn = jest.fn();
    getNodeMiddleware(app);

    expect(console.warn).toHaveBeenCalledWith(
      "[@octokit/oauth-app] getNodeMiddleWare() is deprecated. Use createNodeMiddleware() instead"
    );
  });
});
