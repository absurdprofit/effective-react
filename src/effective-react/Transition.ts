import { Effect } from "effect";
import { ReactContext, ENABLE_TRANSITION_SYMBOL } from "./ReactContext";

export const EnableTransition = Effect.gen(function* () {
  const context = yield* ReactContext;
  yield* Effect.sync(() => context[ENABLE_TRANSITION_SYMBOL](true));
});

export const DisableTransition = Effect.gen(function* () {
  const context = yield* ReactContext;
  yield* Effect.sync(() => context[ENABLE_TRANSITION_SYMBOL](false));
});