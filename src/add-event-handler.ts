import type {
  EventHandler,
  EventAndActionName,
  State,
  ClientType,
  Options,
} from "./types.js";

export function addEventHandler(
  state: State,
  eventName: EventAndActionName | EventAndActionName[],
  eventHandler: EventHandler<Options<ClientType>>,
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
