import { OAuthApp } from "../src";

describe("Smoke test", () => {
  it("is a function", () => {
    expect(OAuthApp).toBeInstanceOf(Function);
  });

  it("OAuthApp.VERSION is set", () => {
    expect(OAuthApp.VERSION).toEqual("0.0.0-development");
  });
});
