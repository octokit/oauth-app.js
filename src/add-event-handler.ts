import {
  EventHandler,
  EventAndActionName,
  State,
  ClientType,
  OAuthAppOctokitClassType,
} from "./types";

export function addEventHandler(
  state: State,
  eventName: EventAndActionName | EventAndActionName[],
  eventHandler: EventHandler<ClientType, OAuthAppOctokitClassType>
) {
  if (Array.isArray(eventName)) {
    for (const singleEventName of eventName) {
      addEventHandler(state, singleEventName, eventHandler);
    }
    return;
  }
  if (!state.eventHandlers[eventName]) {
    state.eventHandlers[eventName] = [];
  }

  state.eventHandlers[eventName].push(eventHandler);
}
