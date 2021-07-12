# Middlewares for Common Environments

If you want to use Node.js middleware, read main [README.md](../../README.md#createnodemiddlewareapp-options) instead. If you need to implement a handler/middleware for another environment, read this document.

The `middleware` directory contains the generic HTTP handler. Each sub-directory (e.g., [`node`](node)) exposes an HTTP handler/middleware for a specific environment.

```
middleware
├── handle-request.ts
├── on-unhandled-request-default.ts
├── types.ts
├── node/
├── cloudflare/ (to be implemented)
└── deno/ (to be implemented)
```

## Generic HTTP Handler

[`handleRequest`](handle-request.ts) function is an abstract HTTP handler which accepts an `OctokitRequest` and returns an `OctokitResponse` if the request matches any predefined route.

> Different environments (e.g., Node.js, Cloudflare, etc.) exposes different APIs when processing HTTP requests (e.g., [`IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) for Node.js, [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) for Cloudflare workers, etc.). Two HTTP-related types ([`OctokitRequest` and `OctokitResponse`](./types.ts)) are generalized to make an abstract HTTP handler possible.

To share the behavior and capability with the existing Node.js middleware (and be compatible with [OAuth user authentication strategy in the browser](https://github.com/octokit/auth-oauth-user-client.js)), it is better to implement your HTTP handler/middleware based on `handleRequest` function.

`handleRequest` function takes three parameters:

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
        <code>request</code>
      </th>
      <th>
        <code>OctokitRequest</code>
      </th>
      <td>
        Generalized HTTP request in `OctokitRequest` type.
      </td>
    </tr>
  </tbody>
</table>

## Adapt for an Environment

Implementing an HTTP handler/middleware for a certain environment involves three steps:

1. Write a function to parse the HTTP request (e.g., `IncomingMessage` in Node.js) into an `OctokitRequest` object. See [`node/parse-request.ts`](node/parse-request.ts) for reference.
2. Write a function to render an `OctokitResponse` object (e.g., as `ServerResponse` in Node.js). See [`node/send-response.ts`](node/send-response.ts) for reference.
3. Expose an HTTP handler/middleware in the dialect of the environment which performs three steps:
   1. Parse the HTTP request using (1).
   2. Process the `OctokitRequest` object using `handleRequest`. If the request is not handled by `handleRequest` (the request does not match any predefined route), [`onUnhandledRequestDefault`](on-unhandled-request-default.ts) can be used to generate a `404` response consistently.
   3. Render the `OctokitResponse` object using (2).
