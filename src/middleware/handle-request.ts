import { OAuthApp } from "../index.js";
import { unknownRouteResponse } from "./unknown-route-response.js";
import type {
  HandlerOptions,
  OctokitRequest,
  OctokitResponse,
} from "./types.js";
import type { ClientType, Options } from "../types.js";

export async function handleRequest(
  app: OAuthApp<Options<ClientType>>,
  { pathPrefix = "/api/github/oauth" }: HandlerOptions,
  request: OctokitRequest,
): Promise<OctokitResponse | undefined> {
  // request.url may include ?query parameters which we don't want for `route`
  // hence the workaround using new URL()
  let { pathname } = new URL(request.url as string, "http://localhost");
  if (!pathname.startsWith(`${pathPrefix}/`)) {
    return undefined;
  }

  if (request.method === "OPTIONS") {
    return {
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "*",
        "access-control-allow-headers":
          "Content-Type, User-Agent, Authorization",
      },
    };
  }

  pathname = pathname.slice(pathPrefix.length + 1);

  const route = [request.method, pathname].join(" ");
  const routes = {
    getLogin: `GET login`,
    getCallback: `GET callback`,
    createToken: `POST token`,
    getToken: `GET token`,
    patchToken: `PATCH token`,
    patchRefreshToken: `PATCH refresh-token`,
    scopeToken: `POST token/scoped`,
    deleteToken: `DELETE token`,
    deleteGrant: `DELETE grant`,
  };

  // handle unknown routes
  if (!Object.values(routes).includes(route)) {
    return unknownRouteResponse(request);
  }

  let json: any;
  try {
    const text = await request.text();
    json = text ? JSON.parse(text) : {};
  } catch (error) {
    return {
      status: 400,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
      text: JSON.stringify({
        error: "[@octokit/oauth-app] request error",
      }),
    };
  }
  const { searchParams } = new URL(request.url as string, "http://localhost");
  const query = Object.fromEntries(searchParams) as {
    state?: string;
    scopes?: string;
    code?: string;
    redirectUrl?: string;
    allowSignup?: string;
    error?: string;
    error_description?: string;
    error_url?: string;
  };
  const headers = request.headers as { authorization?: string };

  try {
    if (route === routes.getLogin) {
      const authOptions = {};

      if (query.state) {
        Object.assign(authOptions, { state: query.state });
      }

      if (query.scopes) {
        Object.assign(authOptions, { scopes: query.scopes.split(",") });
      }

      if (query.allowSignup) {
        Object.assign(authOptions, {
          allowSignup: query.allowSignup === "true",
        });
      }

      if (query.redirectUrl) {
        Object.assign(authOptions, { redirectUrl: query.redirectUrl });
      }

      const { url } = app.getWebFlowAuthorizationUrl(authOptions);

      return { status: 302, headers: { location: url } };
    }

    if (route === routes.getCallback) {
      if (query.error) {
        throw new Error(
          `[@octokit/oauth-app] ${query.error} ${query.error_description}`,
        );
      }
      if (!query.code) {
        throw new Error('[@octokit/oauth-app] "code" parameter is required');
      }

      const {
        authentication: { token },
      } = await app.createToken({
        code: query.code,
      });

      return {
        status: 200,
        headers: {
          "content-type": "text/html",
        },
        text: `<h1>Token created successfully</h1>

<p>Your token is: <strong>${token}</strong>. Copy it now as it cannot be shown again.</p>`,
      };
    }

    if (route === routes.createToken) {
      const { code, redirectUrl } = json;

      if (!code) {
        throw new Error('[@octokit/oauth-app] "code" parameter is required');
      }

      const result = await app.createToken({
        code,
        redirectUrl,
      });

      // @ts-ignore
      delete result.authentication.clientSecret;

      return {
        status: 201,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.getToken) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required',
        );
      }

      const result = await app.checkToken({
        token,
      });

      // @ts-ignore
      delete result.authentication.clientSecret;

      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.patchToken) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required',
        );
      }

      const result = await app.resetToken({ token });

      // @ts-ignore
      delete result.authentication.clientSecret;

      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.patchRefreshToken) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required',
        );
      }

      const { refreshToken } = json;

      if (!refreshToken) {
        throw new Error(
          "[@octokit/oauth-app] refreshToken must be sent in request body",
        );
      }

      const result = await app.refreshToken({ refreshToken });

      // @ts-ignore
      delete result.authentication.clientSecret;

      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.scopeToken) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required',
        );
      }

      const result = await app.scopeToken({
        token,
        ...json,
      });

      // @ts-ignore
      delete result.authentication.clientSecret;

      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.deleteToken) {
      const token = headers.authorization?.substr("token ".length) as string;

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required',
        );
      }

      await app.deleteToken({
        token,
      });

      return {
        status: 204,
        headers: { "access-control-allow-origin": "*" },
      };
    }

    // route === routes.deleteGrant
    const token = headers.authorization?.substr("token ".length) as string;

    if (!token) {
      throw new Error(
        '[@octokit/oauth-app] "Authorization" header is required',
      );
    }

    await app.deleteAuthorization({
      token,
    });

    return {
      status: 204,
      headers: { "access-control-allow-origin": "*" },
    };
  } catch (error: any) {
    return {
      status: 400,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
      text: JSON.stringify({ error: error.message }),
    };
  }
}
