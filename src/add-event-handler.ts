import { EventHandler, EventAndActionName, State } from "./types";

export function addEventHandler(
  state: State,
  eventName: EventAndActionName | EventAndActionName[],
  eventHandler: EventHandler
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
