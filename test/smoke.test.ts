import {
  handleRequest,
  OAuthApp,
  sendNodeResponse,
  unknownRouteResponse,
} from "../src/index.ts";
import { describe, expect, it } from "vitest";

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

  it("handleRequest is a function", () => {
    expect(typeof handleRequest).toEqual("function");
  });

  it("unknownRouteResponse is a function", () => {
    expect(typeof unknownRouteResponse).toEqual("function");
  });

  it("sendNodeResponse is a function", () => {
    expect(typeof sendNodeResponse).toEqual("function");
  });
});
