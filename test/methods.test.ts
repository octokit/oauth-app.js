import { getAuthorizationUrl } from "../src";

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
});
