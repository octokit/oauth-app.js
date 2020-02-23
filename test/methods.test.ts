import nock from "nock";

import { getAuthorizationUrl, createToken } from "../src";

describe("app", () => {
  it("getAuthorizationUrl", () => {
    expect(getAuthorizationUrl).toBeInstanceOf(Function);
  });

  it("getAuthorizationUrl(options)", () => {
    const url = getAuthorizationUrl({
      clientId: "0123",
      state: "state123"
    });
    expect(url).toStrictEqual(
      "https://github.com/login/oauth/authorize?allow_signup=true&client_id=0123&state=state123"
    );
  });

  it("createToken", () => {
    expect(createToken).toBeInstanceOf(Function);
  });

  it("createToken(options)", async () => {
    nock("https://github.com")
      .post("/login/oauth/access_token")
      .reply(200, {
        access_token: "token123",
        scope: "repo,gist",
        token_type: "bearer"
      });

    const { token, scopes } = await createToken({
      clientId: "0123",
      clientSecret: "0123secret",
      state: "state123",
      code: "code123"
    });

    expect(token).toEqual("token123");
    expect(scopes).toEqual(["repo", "gist"]);
  });
});
