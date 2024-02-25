import { createAWSLambdaAPIGatewayV2Handler, OAuthApp } from "../src/index.ts";
import { URL } from "node:url";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

describe("createAWSLambdaAPIGatewayV2Handler(app)", () => {
  it("supports oauth app", async () => {
    const app = new OAuthApp({
      clientType: "oauth-app",
      clientId: "0123",
      clientSecret: "0123secret",
    });
    createAWSLambdaAPIGatewayV2Handler(app);
  });

  it("supports github app", async () => {
    const app = new OAuthApp({
      clientType: "github-app",
      clientId: "0123",
      clientSecret: "0123secret",
    });
    createAWSLambdaAPIGatewayV2Handler(app);
  });

  it("do not handle request with different prefix", async () => {
    const appMock = {};
    const handleRequest = createAWSLambdaAPIGatewayV2Handler(
      appMock as unknown as OAuthApp,
    );

    const response = await handleRequest({
      requestContext: { http: { method: "GET" }, stage: "prod" },
      rawPath: "/prod/unknown",
    } as APIGatewayProxyEventV2);

    expect(response).toBeUndefined();
  });

  it("fail-over to default unhandled request handler", async () => {
    const appMock = {};
    const handleRequest = createAWSLambdaAPIGatewayV2Handler(
      appMock as unknown as OAuthApp,
    );

    const response = (await handleRequest({
      requestContext: { http: { method: "GET" }, stage: "prod" },
      rawPath: "/prod/api/github/oauth/unknown",
    } as APIGatewayProxyEventV2))!;

    expect(response.statusCode).toBe(404);
  });

  it("allow pre-flight requests", async () => {
    const app = new OAuthApp({ clientId: "0123", clientSecret: "0123secret" });
    const handleRequest = createAWSLambdaAPIGatewayV2Handler(app);

    const response = (await handleRequest({
      requestContext: { http: { method: "OPTIONS" }, stage: "prod" },
      rawPath: "/prod/api/github/oauth/token",
    } as APIGatewayProxyEventV2))!;

    expect(response.statusCode).toStrictEqual(200);
    expect(response.headers!["access-control-allow-origin"]).toBe("*");
    expect(response.headers!["access-control-allow-methods"]).toBe("*");
    expect(response.headers!["access-control-allow-headers"]).toBe(
      "Content-Type, User-Agent, Authorization",
    );
  });

  it("supports $default stage", async () => {
    const app = new OAuthApp({ clientId: "0123", clientSecret: "0123secret" });
    const handleRequest = createAWSLambdaAPIGatewayV2Handler(app);

    const response = (await handleRequest({
      requestContext: { http: { method: "GET" }, stage: "$default" },
      rawPath: "/api/github/oauth/login",
    } as APIGatewayProxyEventV2))!;

    expect(response.statusCode).toBe(302);
    const url = new URL(response.headers!.location as string);
    expect(url.origin).toBe("https://github.com");
    expect(url.pathname).toBe("/login/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("scope")).toBeNull();
  });

  it("supports named stage", async () => {
    const app = new OAuthApp({ clientId: "0123", clientSecret: "0123secret" });
    const handleRequest = createAWSLambdaAPIGatewayV2Handler(app);

    const response = (await handleRequest({
      requestContext: { http: { method: "GET" }, stage: "prod" },
      rawPath: "/prod/api/github/oauth/login",
    } as APIGatewayProxyEventV2))!;

    expect(response.statusCode).toBe(302);
    const url = new URL(response.headers!.location as string);
    expect(url.origin).toBe("https://github.com");
    expect(url.pathname).toBe("/login/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("0123");
    expect(url.searchParams.get("state")).toMatch(/^\w+$/);
    expect(url.searchParams.get("scope")).toBeNull();
  });

  it("passes query string to generic request handler correctly", async () => {
    const app = new OAuthApp({ clientId: "0123", clientSecret: "0123secret" });
    const handleRequest = createAWSLambdaAPIGatewayV2Handler(app);

    const response = (await handleRequest({
      requestContext: { http: { method: "GET" }, stage: "prod" },
      rawPath: "/prod/api/github/oauth/login",
      rawQueryString: "state=mystate123&scopes=one,two,three",
    } as APIGatewayProxyEventV2))!;

    expect(response.statusCode).toBe(302);
    const url = new URL(response.headers!.location as string);
    expect(url.origin).toBe("https://github.com");
    expect(url.pathname).toBe("/login/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("0123");
    expect(url.searchParams.get("state")).toBe("mystate123");
    expect(url.searchParams.get("scope")).toBe("one,two,three");
  });
});
