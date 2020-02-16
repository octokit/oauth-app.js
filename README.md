# oauth-app.js

> GitHub OAuth toolset for Node.js

[![@latest](https://img.shields.io/npm/v/@octokit/oauth-app.svg)](https://www.npmjs.com/package/@octokit/oauth-app)
[![Build Status](https://github.com/octokit/oauth-app.js/workflows/Test/badge.svg)](https://github.com/octokit/oauth-app.js/actions?workflow=Test)
[![Greenkeeper](https://badges.greenkeeper.io/octokit/oauth-app.js.svg)](https://greenkeeper.io/)

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

Install with `npm install @octokit/core @octokit/oauth-app`

```js
const { OAuthApp, getNodeMiddleware } = require("@octokit/oauth-app");

const app = new OAuthApp({
  clientId: "0123",
  clientSecret: "0123secret"
});

app.on("token", async ({ token, octokit }) => {
  const { data } = await octokit.request("GET /user");
  console.log(`Token retrieved for ${data.login}`);
});

require("http")
  .createServer(getNodeMiddleware(app))
  .listen(3000);
// can now receive user authorization callbacks at /api/github/oauth/callback
```

</td></tr>
</tbody>
</table>

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
