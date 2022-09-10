import * as nodeFetch from "node-fetch";
import fromEntries from "fromentries";

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

  it("has no deprecations currently", async () => {});
});
