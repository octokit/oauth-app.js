import { URL } from "url";
import * as nodeFetch from "node-fetch";
import fromEntries from "fromentries";
import {
  createAWSLambdaAPIGatewayV2Handler,
  createCloudflareHandler,
  OAuthApp,
} from "../src";
import { Octokit } from "@octokit/core";

describe("deprecations", () => {
  beforeAll(() => {
    Object.fromEntries ||= fromEntries;
    (global as any).Request = nodeFetch.Request;
    (global as any).Response = nodeFetch.Response;
  });

  afterAll(() => {
    delete (global as any).Request;
    delete (global as any).Response;
  });

  it("createCloudflareHandler works but logs out deprecation message", async () => {
    const warn = jest.fn().mockResolvedValue(undefined);
    const handleRequest = createCloudflareHandler(
      new OAuthApp({
        clientType: "github-app",
        clientId: "client_id_123",
        clientSecret: "client_secret_456",
        Octokit: Octokit.defaults({
          log: {
            debug: () => undefined,
            info: () => undefined,
            warn,
            error: () => undefined,
          },
        }),
      })
    );

    expect(warn.mock.calls.length).toEqual(1);
    expect(warn.mock.calls[0][0]).toEqual(
      "[@octokit/oauth-app] `createCloudflareHandler` is deprecated, use `createWebWorkerHandler` instead"
    );

    const request = new Request("/api/github/oauth/login");
    const { status, headers } = await handleRequest(request);

    expect(status).toEqual(302);
    const url = new URL(headers.get("location") as string);
    expect(url).toMatchObject({
      origin: "https://github.com",
      pathname: "/login/oauth/authorize",
    });
    expect(url.searchParams.get("client_id")).toEqual("client_id_123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("scope")).toEqual(null);
  });

  it("`onUnhandledRequest` is deprecated and will be removed from the next major version", async () => {
    const warn = jest.fn().mockResolvedValue(undefined);
    createAWSLambdaAPIGatewayV2Handler(
      new OAuthApp({
        clientType: "github-app",
        clientId: "client_id_123",
        clientSecret: "client_secret_456",
        Octokit: Octokit.defaults({
          log: {
            debug: () => undefined,
            info: () => undefined,
            warn,
            error: () => undefined,
          },
        }),
      }),
      {
        onUnhandledRequest: async () => {
          return {
            statusCode: 404,
            headers: {},
            body: "",
          };
        },
      }
    );

    expect(warn.mock.calls.length).toEqual(1);
    expect(warn.mock.calls[0][0]).toEqual(
      "[@octokit/oauth-app] `onUnhandledRequest` is deprecated and will be removed from the next major version."
    );
  });
});
