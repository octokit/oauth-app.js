import {
  State,
  EventHandlerContext,
  ClientType,
  OAuthAppOctokitClassType,
} from "./types";

export async function emitEvent(
  state: State,
  context: EventHandlerContext<ClientType, OAuthAppOctokitClassType>
) {
  const { name, action } = context;

  if (state.eventHandlers[`${name}.${action}`]) {
    for (const eventHandler of state.eventHandlers[`${name}.${action}`]) {
      await eventHandler(context);
    }
  }

  if (state.eventHandlers[name]) {
    for (const eventHandler of state.eventHandlers[name]) {
      await eventHandler(context);
    }
  }
}
