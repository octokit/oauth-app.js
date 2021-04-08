import { IncomingMessage, ServerResponse } from "http";

import { parseRequest } from "./parse-request";

import { OAuthApp } from "../../index";
import { MiddlewareOptions } from "./types";
import { Options, ClientType } from "../../types";

export async function middleware(
  app: OAuthApp<Options<ClientType>>,
  options: Required<MiddlewareOptions>,
  request: IncomingMessage,
  response: ServerResponse
) {
  // request.url mayb include ?query parameters which we don't want for `route`
  // hence the workaround using new URL()
  const { pathname } = new URL(request.url as string, "http://localhost");
  const route = [request.method, pathname].join(" ");
  const routes = {
    getLogin: `GET ${options.pathPrefix}/login`,
    getCallback: `GET ${options.pathPrefix}/callback`,
    createToken: `POST ${options.pathPrefix}/token`,
    getToken: `GET ${options.pathPrefix}/token`,
    patchToken: `PATCH ${options.pathPrefix}/token`,
    patchRefreshToken: `PATCH ${options.pathPrefix}/refresh-token`,
    scopeToken: `POST ${options.pathPrefix}/token/scoped`,
    deleteToken: `DELETE ${options.pathPrefix}/token`,
    deleteGrant: `DELETE ${options.pathPrefix}/grant`,
  };

  if (!Object.values(routes).includes(route)) {
    options.onUnhandledRequest(request, response);
    return;
  }

  let parsedRequest;
  try {
    parsedRequest = await parseRequest(request);
  } catch (error) {
    response.writeHead(400, {
      "content-type": "application/json",
    });
    return response.end(
      JSON.stringify({
        error: "[@octokit/oauth-app] request error",
      })
    );
  }
  const { headers, query, body = {} } = parsedRequest;

  try {
    if (route === routes.getLogin) {
      const { url } = app.getWebFlowAuthorizationUrl({
        state: query.state,
        scopes: query.scopes?.split(","),
        allowSignup: query.allowSignup,
        redirectUrl: query.redirectUrl,
      });

      response.writeHead(302, { location: url });
      return response.end();
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

      response.writeHead(200, {
        "content-type": "text/html",
      });
      response.write(`<h1>Token created successfull</h1>
    
<p>Your token is: <strong>${token}</strong>. Copy it now as it cannot be shown again.</p>`);

      return response.end();
    }

    if (route === routes.createToken) {
      const { state: oauthState, code, redirectUrl } = body;

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

      response.writeHead(201, {
        "content-type": "application/json",
      });

      return response.end(JSON.stringify({ token, scopes }));
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

      response.writeHead(200, {
        "content-type": "application/json",
      });
      return response.end(JSON.stringify(result));
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

      response.writeHead(200, {
        "content-type": "application/json",
      });
      return response.end(JSON.stringify(result));
    }

    if (route === routes.patchRefreshToken) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const { refreshToken } = body;

      if (!refreshToken) {
        throw new Error(
          "[@octokit/oauth-app] refreshToken must be sent in request body"
        );
      }

      const result = await app.refreshToken({ refreshToken });

      response.writeHead(200, {
        "content-type": "application/json",
      });
      return response.end(JSON.stringify(result));
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
        ...body,
      });

      response.writeHead(200, {
        "content-type": "application/json",
      });
      return response.end(JSON.stringify(result));
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

      response.writeHead(204);
      return response.end();
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

    response.writeHead(204);
    return response.end();
  } catch (error) {
    response.writeHead(400, {
      "content-type": "application/json",
    });
    response.end(
      JSON.stringify({
        error: error.message,
      })
    );
  }
}
