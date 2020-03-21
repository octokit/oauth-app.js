import { createOAuthAppAuth } from "@octokit/auth-oauth-app";

import { emitEvent } from "../emit-event";
import { State } from "../types";

type Options = {
  clientId: string;
  clientSecret: string;
  state: string;
  code: string;
};

type StateOptions = {
  state: string;
  code: string;
};

type Auth = ReturnType<typeof createOAuthAppAuth>;

async function createTokenWithAuth(auth: Auth, options: StateOptions) {
  // @ts-ignore fix return types for auth()
  const { token, scopes } = await auth({
    type: "token",
    state: options.state,
    code: options.code,
  });

  return { token, scopes };
}

export function createToken(options: Options) {
  const { clientId, clientSecret, ...otherOptions } = options;
  const auth = createOAuthAppAuth({
    clientId,
    clientSecret,
  });

  return createTokenWithAuth(auth, otherOptions);
}

export async function createTokenWithState(
  state: State,
  options: StateOptions
) {
  const result = await createTokenWithAuth(state.octokit.auth as Auth, options);

  await emitEvent(state, {
    name: "token",
    action: "created",
    token: result.token,
    scopes: result.scopes,
    get octokit() {
      return new state.Octokit({ auth: result.token });
    },
  });

  return result;
}

export type AppCreateToken = (
  options: StateOptions
) => ReturnType<typeof createTokenWithState>;
