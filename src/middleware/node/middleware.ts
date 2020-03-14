import { IncomingMessage, ServerResponse } from "http";

import { parseRequest } from "./parse-request";

import { OAuthApp } from "../../index";
import { MiddlewareOptions } from "./types";

export async function middleware(
  app: OAuthApp,
  options: Required<MiddlewareOptions>,
  request: IncomingMessage,
  response: ServerResponse
) {
  let parsedRequest;
  try {
    parsedRequest = await parseRequest(request);
  } catch (error) {
    response.writeHead(400, {
      "content-type": "application/json"
    });
    return response.end(
      JSON.stringify({
        error: "[@octokit/oauth-app] request error"
      })
    );
  }
  const { route, headers, query, body } = parsedRequest;

  try {
    if (route === `GET ${options.pathPrefix}/login`) {
      const url = app.getAuthorizationUrl({
        state: query.state,
        scopes: query.scopes?.split(","),
        allowSignup: query.allowSignup,
        redirectUrl: query.redirectUrl
      });

      response.writeHead(302, { location: url });
      return response.end();
    }

    if (route === `GET ${options.pathPrefix}/callback`) {
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

      const { token } = await app.createToken({
        state: query.state,
        code: query.code
      });

      response.writeHead(200, {
        "content-type": "text/html"
      });
      response.write(`<h1>Token created successfull</h1>
    
<p>Your token is: <strong>${token}</strong>. Copy it now as it cannot be shown again.</p>`);

      return response.end();
    }

    if (route === `POST ${options.pathPrefix}/token`) {
      // @ts-ignore body is guaraenteed to exist
      const { state: oauthState, code, redirectUrl } = body;

      if (!oauthState || !code) {
        throw new Error(
          '[@octokit/oauth-app] Both "code" & "state" parameters are required'
        );
      }

      const { token, scopes } = await app.createToken({
        state: oauthState,
        code
      });

      response.writeHead(201, {
        "content-type": "application/json"
      });

      return response.end(JSON.stringify({ token, scopes }));
    }

    if (route === `GET ${options.pathPrefix}/token`) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const result = await app.checkToken({
        token
      });

      response.writeHead(200, {
        "content-type": "application/json"
      });
      return response.end(JSON.stringify(result));
    }

    if (route === `PATCH ${options.pathPrefix}/token`) {
      const token = headers.authorization?.substr("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const result = await app.resetToken({
        token
      });

      response.writeHead(200, {
        "content-type": "application/json"
      });
      return response.end(JSON.stringify(result));
    }

    if (route === `DELETE ${options.pathPrefix}/token`) {
      const token = headers.authorization?.substr("token ".length) as string;

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      await app.deleteToken({
        token
      });

      response.writeHead(204);
      return response.end();
    }

    if (route === `DELETE ${options.pathPrefix}/grant`) {
      const token = headers.authorization?.substr("token ".length) as string;

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      await app.deleteAuthorization({
        token
      });

      response.writeHead(204);
      return response.end();
    }

    options.onUnhandledRequest(request, response);
  } catch (error) {
    response.writeHead(400, {
      "content-type": "application/json"
    });
    response.end(
      JSON.stringify({
        error: error.message
      })
    );
  }
}
