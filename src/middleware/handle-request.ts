import { OAuthApp } from "../index";
import { OctokitRequest, OctokitResponse, HandlerOptions } from "./types";
import { ClientType, Options } from "../types";
// @ts-ignore - requires esModuleInterop flag
import fromEntries from "fromentries";

export async function handleRequest(
  app: OAuthApp<Options<ClientType>>,
  { pathPrefix = "/api/github/oauth" }: HandlerOptions,
  request: OctokitRequest
): Promise<OctokitResponse | null> {
  // request.url may include ?query parameters which we don't want for `route`
  // hence the workaround using new URL()
  const { pathname } = new URL(request.url as string, "http://localhost");
  const route = [request.method, pathname].join(" ");
  const routes = {
    getLogin: `GET ${pathPrefix}/login`,
    getCallback: `GET ${pathPrefix}/callback`,
    createToken: `POST ${pathPrefix}/token`,
    getToken: `GET ${pathPrefix}/token`,
    patchToken: `PATCH ${pathPrefix}/token`,
    patchRefreshToken: `PATCH ${pathPrefix}/refresh-token`,
    scopeToken: `POST ${pathPrefix}/token/scoped`,
    deleteToken: `DELETE ${pathPrefix}/token`,
    deleteGrant: `DELETE ${pathPrefix}/grant`,
  };

  // handle unknown routes
  if (!Object.values(routes).includes(route)) {
    return null;
  }

  let json: any;
  try {
    const text = await request.text();
    json = text ? JSON.parse(text) : {};
  } catch (error) {
    return {
      status: 400,
      headers: { "content-type": "application/json" },
      text: JSON.stringify({
        error: "[@octokit/oauth-app] request error",
      }),
    };
  }
  const { searchParams } = new URL(request.url as string, "http://localhost");
  const query = fromEntries(searchParams) as {
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
      const { url } = app.getWebFlowAuthorizationUrl({
        state: query.state,
        scopes: query.scopes ? query.scopes.split(",") : undefined,
        allowSignup: query.allowSignup !== "false",
        redirectUrl: query.redirectUrl,
      });

      return { status: 302, headers: { location: url } };
    }

    if (route === routes.getCallback) {
      if (query.error) {
        throw new Error(
          `[@octokit/oauth-app] ${query.error} ${query.error_description}`
        );
      }
      if (!query.state || !query.code) {
        throw new Error(
          '[@octokit/oauth-app] Both "code" & "state" parameters are required'
        );
      }

      const {
        authentication: { token },
      } = await app.createToken({
        state: query.state,
        code: query.code,
      });

      return {
        status: 200,
        headers: {
          "content-type": "text/html",
        },
        text: `<h1>Token created successfull</h1>
    
<p>Your token is: <strong>${token}</strong>. Copy it now as it cannot be shown again.</p>`,
      };
    }

    if (route === routes.createToken) {
      const { state: oauthState, code, redirectUrl } = json;

      if (!oauthState || !code) {
        throw new Error(
          '[@octokit/oauth-app] Both "code" & "state" parameters are required'
        );
      }

      const {
        authentication: { token, scopes },
      } = await app.createToken({
        state: oauthState,
        code,
        redirectUrl,
      });

      return {
        status: 201,
        headers: { "content-type": "application/json" },
        text: JSON.stringify({ token, scopes }),
      };
    }

    if (route === routes.getToken) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const result = await app.checkToken({
        token,
      });

      return {
        status: 200,
        headers: { "content-type": "application/json" },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.patchToken) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const result = await app.resetToken({
        token,
      });

      return {
        status: 200,
        headers: { "content-type": "application/json" },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.patchRefreshToken) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const { refreshToken } = json;

      if (!refreshToken) {
        throw new Error(
          "[@octokit/oauth-app] refreshToken must be sent in request body"
        );
      }

      const result = await app.refreshToken({ refreshToken });

      return {
        status: 200,
        headers: { "content-type": "application/json" },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.scopeToken) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const result = await app.scopeToken({
        token,
        ...json,
      });

      return {
        status: 200,
        headers: { "content-type": "application/json" },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.deleteToken) {
      const token = headers.authorization?.substr("token ".length) as string;

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      await app.deleteToken({
        token,
      });

      return { status: 204 };
    }

    // route === routes.deleteGrant
    const token = headers.authorization?.substr("token ".length) as string;

    if (!token) {
      throw new Error(
        '[@octokit/oauth-app] "Authorization" header is required'
      );
    }

    await app.deleteAuthorization({
      token,
    });

    return { status: 204 };
  } catch (error) {
    return {
      status: 400,
      headers: { "content-type": "application/json" },
      text: JSON.stringify({ error: error.message }),
    };
  }
}
