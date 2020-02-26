import nock from "nock";

import {
  getAuthorizationUrl,
  createToken,
  checkToken,
  resetToken,
  deleteToken,
  deleteAuthorization
} from "../src";

nock.disableNetConnect();

describe("app", () => {
  it("getAuthorizationUrl(options)", () => {
    const url = getAuthorizationUrl({
      clientId: "0123",
      state: "state123"
    });
    expect(url).toStrictEqual(
      "https://github.com/login/oauth/authorize?allow_signup=true&client_id=0123&state=state123"
    );
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

  it("checkToken(options)", async () => {
    nock("https://api.github.com", {
      reqheaders: {
        authorization: "basic MDEyMzowMTIzc2VjcmV0"
      }
    })
      .post("/applications/0123/token", {
        access_token: "token123"
      })
      .reply(200, { ok: true });

    const result = await checkToken({
      clientId: "0123",
      clientSecret: "0123secret",
      token: "token123"
    });

    expect(result).toStrictEqual({ ok: true });
  });

  it("resetToken(options)", async () => {
    nock("https://api.github.com", {
      reqheaders: {
        authorization: "basic MDEyMzowMTIzc2VjcmV0"
      }
    })
      .patch("/applications/0123/token", {
        access_token: "token123"
      })
      .reply(200, { ok: true });

    const result = await resetToken({
      clientId: "0123",
      clientSecret: "0123secret",
      token: "token123"
    });

    expect(result).toStrictEqual({ ok: true });
  });

  it("deleteToken(options)", async () => {
    nock("https://api.github.com", {
      reqheaders: {
        authorization: "basic MDEyMzowMTIzc2VjcmV0"
      }
    })
      .delete("/applications/0123/token", {
        access_token: "token123"
      })
      .reply(204);

    await deleteToken({
      clientId: "0123",
      clientSecret: "0123secret",
      token: "token123"
    });
  });

  it("deleteAuthorization(options)", async () => {
    nock("https://api.github.com")
      .delete("/applications/0123/grant", {
        access_token: "token123"
      })
      .reply(204);

    await deleteAuthorization({
      clientId: "0123",
      clientSecret: "0123secret",
      token: "token123"
    });
  });
});
