import { OAuthApp } from "../src";

describe("app", () => {
  it("app.getAuthorizationUrl is function", () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret"
    });
    expect(app.getAuthorizationUrl).toBeInstanceOf(Function);
  });

  it("app.getAuthorizationUrl(options)", () => {
    const app = new OAuthApp({
      clientId: "0123",
      clientSecret: "0123secret"
    });
    const url = app.getAuthorizationUrl({
      state: "state123"
    });
    expect(url).toStrictEqual(
      "https://github.com/login/oauth/authorize?allow_signup=true&client_id=0123&state=state123"
    );
  });
});
