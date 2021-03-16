# oauth-app.js

> GitHub OAuth toolset for Node.js

[![@latest](https://img.shields.io/npm/v/@octokit/oauth-app.svg)](https://www.npmjs.com/package/@octokit/oauth-app)
[![Build Status](https://github.com/octokit/oauth-app.js/workflows/Test/badge.svg)](https://github.com/octokit/oauth-app.js/actions?workflow=Test)

<details>
  <summary>Table of contents</summary>

<!-- toc -->

- [Usage](#usage)
- [Examples](#examples)
- [Constructor options](#constructor-options)
- [`app.on(eventName, eventHandler)`](#apponeventname-eventhandler)
- [`app.octokit`](#appoctokit)
- [`app.getAuthorizationUrl(options)`](#appgetauthorizationurloptions)
- [`app.createToken(options)`](#appcreatetokenoptions)
- [`app.checkToken(options)`](#appchecktokenoptions)
- [`app.resetToken(options)`](#appresettokenoptions)
- [`app.deleteToken(options)`](#appdeletetokenoptions)
- [`app.deleteAuthorization(options)`](#appdeleteauthorizationoptions)
- [Stateless methods](#stateless-methods)
  - [`getAuthorizationUrl(options)`](#getauthorizationurloptions)
  - [`createToken(options)`](#createtokenoptions)
  - [`checkToken(options)`](#checktokenoptions)
  - [`resetToken(options)`](#resettokenoptions)
  - [`deleteToken(options)`](#deletetokenoptions)
  - [`deleteAuthorization(options)`](#deleteauthorizationoptions)
- [Middlewares](#middlewares)
  - [`createNodeMiddleware(app, options)`](#getnodemiddlewareapp-options)
- [Contributing](#contributing)
- [License](#license)

<!-- tocstop -->

</details>

## Usage

<table>
<tbody valign=top align=left>
<tr><th>

Browsers

</th><td width=100%>

`@octokit/oauth-app` is not meant for browser usage.

</td></tr>
<tr><th>

Node

</th><td>

Install with `npm install @octokit/oauth-app`

</td></tr>
</tbody>
</table>

### For OAuth Apps

```js
const { OAuthApp, createNodeMiddleware } = require("@octokit/oauth-app");

const app = new OAuthApp({
  clientType: "oauth-app",
  clientId: "1234567890abcdef1234",
  clientSecret: "1234567890abcdef1234567890abcdef12345678",
});

app.on("token", async ({ token, octokit }) => {
  const { data } = await octokit.request("GET /user");
  console.log(`Token retrieved for ${data.login}`);
});

require("http").createServer(createNodeMiddleware(app)).listen(3000);
// can now receive user authorization callbacks at /api/github/oauth/callback
// See all endpoints at https://github.com/octokit/oauth-app.js#middlewares
```

### For GitHub Apps

GitHub Apps do not support `scopes`. If the GitHub App has expiring user tokens enabled, the token used for the `octokit` instance will be refreshed automatically, and the additional refresh-releated properties will be passed to the `"token"` event handler.

```js
const { OAuthApp, getNodeMiddleware } = require("@octokit/oauth-app");

const app = new OAuthApp({
  clientType: "github-app",
  clientId: "lv1.1234567890abcdef",
  clientSecret: "1234567890abcdef1234567890abcdef12345678",
});

app.on("token", async ({ token, octokit, expiresAt }) => {
  const { data } = await octokit.request("GET /user");
  console.log(`Token retrieved for ${data.login}`);
});

require("http").createServer(getNodeMiddleware(app)).listen(3000);
// can now receive user authorization callbacks at /api/github/oauth/callback
// See all endpoints at https://github.com/octokit/oauth-app.js#middlewares
```

## Examples

- Node server with static files served from `public/` folder, hosted on Glitch: <https://glitch.com/~github-oauth-client>
- Serverless functions, hosted on [Zeit's now](https://zeit.co/): <https://github.com/gr2m/octokit-oauth-app-now-example>
- Serverless functions, hosted on AWS (via [begin.com](https://begin.com/)): <https://github.com/gr2m/octokit-oauth-app-begin-example/>

## Constructor options

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>clientId</code>
      </th>
      <th>
        <code>number</code>
      </th>
      <td>
        <strong>Required</strong>. Find <strong>Client ID</strong> on the app’s about page in settings.
      </td>
    </tr>
    <tr>
      <th>
        <code>clientSecret</code>
      </th>
      <th>
        <code>number</code>
      </th>
      <td>
        <strong>Required</strong>. Find <strong>Client Secret</strong> on the app’s about page in settings.
      </td>
    </tr>
    <tr>
      <th>
        <code>clientType</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        Either <code>"oauth-app"</code> or <code>"github-app"</code>. Defaults to <code>"oauth-app"</code>.
      </td>
    </tr>
    <tr>
      <th>
        <code>allowSignup</code>
      </th>
      <th>
        <code>boolean</code>
      </th>
      <td>
        Sets the default value for <code>app.getAuthorizationUrl(options)</code>.
      </td>
    </tr>
    <tr>
      <th>
        <code>defaultScopes</code>
      </th>
      <th>
        <code>Array of strings</code>
      </th>
      <td>

Only relevant when `clientType` is set to `"oauth-app"`.

Sets the default `scopes` value for `app.getAuthorizationUrl(options)`. See [available scopes](https://docs.github.com/en/developers/apps/scopes-for-oauth-apps#available-scopes)

</td></tr>
    <tr>
      <th>
        <code>log</code>
      </th>
      <th>
        <code>object</code>
      </th>
      <td>
        Used for internal logging. Defaults to <a href="https://developer.mozilla.org/en-US/docs/Web/API/console"><code>console</code></a>.
      </td>
    </tr>
    <tr>
      <th>
        <code>Octokit</code>
      </th>
      <th>
        <code>Constructor</code>
      </th>
      <td>

You can pass in your own Octokit constructor with custom defaults and plugins. The Octokit Constructor must use an authenticatio strategy that is compatible with[`@octokit/auth-oauth-app](https://github.com/octokit/auth-oauth-app.js/#readme).

For usage with enterprise, set `baseUrl` to the hostname + `/api/v3`. Example:

```js
const { Octokit } = require("@octokit/oauth-app");
new OAuthApp({
  clientId: "1234567890abcdef1234",
  clientSecret: "1234567890abcdef1234567890abcdef12345678",
  Octokit: Octokit.defaults({
    baseUrl: "https://ghe.my-company.com/api/v3",
  }),
});
```

Defaults to `@octokit/oauth-app`'s owne `Octokit` constructor which can be imported separately from `OAuthApp`. It's [`@octokit/core`](https://github.com/octokit/core.js) with the [`@octokit/auth-oauth-user`](https://github.com/octokit/auth-oauth-user.js/#readme) authentication strategy.

</td></tr>
  </tbody>
</table>

## `app.on(eventName, eventHandler)`

Called whenever a new OAuth access token is created for a user. It accepts two parameters, an event name and a function with one argument

```js
app.on("token.created", async (context) => {
  const { data } = await context.octokit.request("GET /user");
  app.log.info(`New token created for ${data.login}`);
});
```

The `eventName` can be one of (or an array of)

- `token.created`
- `token.reset`
- `token.refreshed` (GitHub Apps only)
- `token.scoped` (GitHub Apps only)
- `token.before_deleted`
- `token.deleted`
- `authorization.before_deleted`
- `authorization.deleted`

All event handlers are awaited before continuing.

`context` can have the following properties

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        property
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>context.name</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        Name of the event. One of: <code>token</code>, <code>authorization</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>context.action</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        Action of the event. One of: <code>created</code>, <code>reset</code>, <code>deleted</code>, <code>before_deleted</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>context.authentication</code>
      </th>
      <th>
        <code>object</code>
      </th>
      <td>

The OAuth authentication object. See https://github.com/octokit/auth-oauth-user.js/#authentication-object

</td>
    </tr>
    <tr>
      <th>
        <code>context.octokit</code>
      </th>
      <th>
        <code>Octokit instance</code>
      </th>
      <td>

Authenticated instance using the `Octokit` option passed to the constructor.

For `"token.deleted"` and `"authorization.deleted"` events the `octokit` instance is unauthenticated.

</td>
    </tr>
  </tbody>
</table>

## `app.octokit`

Octokit instance with [OAuth App authentication](https://github.com/octokit/auth-oauth-app.js/#readme). Uses `Octokit` constructor option

## `app.getAuthorizationUrl(options)`

Returns a URL string.

```js
const url = app.getAuthorizationUrl({
  state: "state123",
  scopes: ["repo"],
});
```

<table>
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>redirectUrl</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The URL in your application where users will be sent after authorization. See <a href="https://docs.github.com/en/developers/apps/authorizing-oauth-apps#redirect-urls">Redirect URLs</a> in GitHub’s Developer Guide.
      </td>
    </tr>
    <tr>
      <th>
        <code>login</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        Suggests a specific account to use for signing in and authorizing the app.
      </td>
    </tr>
    <tr>
      <th>
        <code>scopes</code>
      </th>
      <th>
        <code>array of strings</code>
      </th>
      <td>
        An array of scope names (or: space-delimited list of scopes). If not provided, scope defaults to an empty list for users that have not authorized any scopes for the application. For users who have authorized scopes for the application, the user won't be shown the OAuth authorization page with the list of scopes. Instead, this step of the flow will automatically complete with the set of scopes the user has authorized for the application. For example, if a user has already performed the web flow twice and has authorized one token with user scope and another token with repo scope, a third web flow that does not provide a scope will receive a token with user and repo scope.
      </td>
    </tr>
    <tr>
      <th>
        <code>state</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        An unguessable random string. It is used to protect against cross-site request forgery attacks.
        Defaults to <code>Math.random().toString(36).substr(2)</code>.
      </td>
    </tr>
    <tr>
      <th>
        <code>allowSignup</code>
      </th>
      <th>
        <code>boolean</code>
      </th>
      <td>
        Whether or not unauthenticated users will be offered an option to sign up for GitHub during the OAuth flow. The default is <code>true</code>. Use <code>false</code> in the case that a policy prohibits signups.
      </td>
    </tr>
  </tbody>
</table>

## `app.getUserOctokit()`

```js
const { octokit } = await app.getUserOctokit(options);
```

`options` are [`@octokit/auth-oauth-user`'s strategy options](https://github.com/octokit/auth-oauth-user.js/tree/initial-version#createoauthuserauthoptions-or-new-octokit-auth-)

The `octokit` instance is authorized using the user access token if the app is an OAuth app and a user-to-server token if the app is a GitHub app. If the token expires it will be refreshed automatically.

## `app.createToken(options)`

```js
const { token } = await app.createToken({
  state: "state123",
  code: "code123",
});
```

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>code</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. Pass the code that was passed as <code>?code</code> query parameter in the authorization redirect URL.
      </td>
    </tr>
    <tr>
      <th>
        <code>state</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. Pass the state that was passed as <code>?state</code> query parameter in the authorization redirect URL.
      </td>
    </tr>
  </tbody>
</table>

Resolves with with an [authentication object](https://github.com/octokit/auth-oauth-user.js/tree/initial-version#authentication-object)

## `app.checkToken(options)`

```js
try {
  const { created_at, app, user } = await app.checkToken({ token });
  console.log(
    `token valid, created on %s by %s for %s`,
    created_at,
    user.login,
    app.name
  );
} catch (error) {
  // token invalid or request error
}
```

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>token</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>.
      </td>
    </tr>
  </tbody>
</table>

Resolves with response body from ["Check a token" request](https://docs.github.com/en/rest/reference/apps#check-a-token).

## `app.resetToken(options)`

```js
const { token } = await app.resetToken({
  token: "token123",
});
// "token123" is no longer valid. Use `token` instead
```

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>token</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>.
      </td>
    </tr>
  </tbody>
</table>

Resolves with response body from ["Reset a token" request](https://docs.github.com/en/rest/reference/apps#reset-a-token).

## `app.deleteToken(options)`

```js
await app.deleteToken({
  token: "token123",
});
// "token123" is no longer valid.
```

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>token</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>.
      </td>
    </tr>
  </tbody>
</table>

Resolves with response body from ["Delete a token" request](https://docs.github.com/en/rest/reference/apps#delete-an-app-token).

## `app.deleteAuthorization(options)`

```js
await app.deleteAuthorization({
  token: "token123",
});
// "token123" is no longer valid, and no tokens can be created until the app gets re-authorized.
```

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>token</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>.
      </td>
    </tr>
  </tbody>
</table>

Resolves with response body from ["Delete an app authorization" request](https://docs.github.com/en/rest/reference/apps#delete-an-app-authorization).

## Middlewares

A middleware is a method or set of methods to handle requests for common environments.

By default, all middlewares expose the following routes

| Route                            | Route Description                                                                                                                                                                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/github/oauth/login`    | Redirects to GitHub's authorization endpoint. Accepts optional `?state` and `?scopes` query parameters. `?scopes` is a comma-separated list of [supported OAuth scope names](https://docs.github.com/en/developers/apps/scopes-for-oauth-apps#available-scopes) |
| `GET /api/github/oauth/callback` | The client's redirect endpoint. This is where the `token` event gets triggered                                                                                                                                                                                  |
| `POST /api/github/oauth/token`   | Exchange an authorization code for an OAuth Access token. If successful, the `token` event gets triggered.                                                                                                                                                      |
| `GET /api/github/oauth/token`    | Check if token is valid. Must authenticate using token in `Authorization` header. Uses GitHub's [`POST /applications/{client_id}/token`](https://docs.github.com/en/rest/reference/apps#check-a-token) endpoint                                                 |
| `PATCH /api/github/oauth/token`  | Resets a token (invalidates current one, returns new token). Must authenticate using token in `Authorization` header. Uses GitHub's [`PATCH /applications/{client_id}/token`](https://docs.github.com/en/rest/reference/apps#reset-a-token) endpoint.           |
| `DELETE /api/github/oauth/token` | Invalidates current token, basically the equivalent of a logout. Must authenticate using token in `Authorization` header.                                                                                                                                       |
| `DELETE /api/github/oauth/grant` | Revokes the user's grant, basically the equivalent of an uninstall. must authenticate using token in `Authorization` header.                                                                                                                                    |

### `createNodeMiddleware(app, options)`

Native http server middleware for Node.js

```js
const { OAuthApp, createNodeMiddleware } = require("@octokit/oauth-app");
const app = new OAuthApp({
  clientType: "oauth-app",
  clientId: "1234567890abcdef1234",
  clientSecret: "1234567890abcdef1234567890abcdef12345678",
});

const middleware = createNodeMiddleware(app, {
  pathPrefix: "/api/github/oauth/",
});

require("http").createServer(middleware).listen(3000);
// can now receive user authorization callbacks at /api/github/oauth/callback
```

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>app</code>
      </th>
      <th>
        <code>OAuthApp instance</code>
      </th>
      <td>
        <strong>Required</strong>.
      </td>
    </tr>
    <tr>
      <th>
        <code>options.pathPrefix</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>

All exposed paths will be prefixed with the provided prefix. Defaults to `"/api/github/oauth"`

</td>
    </tr>
    <tr>
      <th>
        <code>options.onUnhandledRequest</code>
      </th>
      <th>
        <code>function</code>
      </th>
      <td>

Defaults to

```js
function onUnhandledRequest(request, response) {
  response.writeHead(400, {
    "content-type": "application/json",
  });
  response.end(
    JSON.stringify({
      error: error.message,
    })
  );
}
```

</td></tr>
  </tbody>
</table>

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
