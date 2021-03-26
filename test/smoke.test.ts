import { OAuthApp } from "../src";

describe("Smoke test", () => {
  it("OAuthApp is a function", () => {
    expect(OAuthApp).toBeInstanceOf(Function);
  });

  it("OAuthApp.defaults is a function", () => {
    expect(OAuthApp.defaults).toBeInstanceOf(Function);
  });

  it("OAuthApp.VERSION is set", () => {
    expect(OAuthApp.VERSION).toEqual("0.0.0-development");
  });
});
