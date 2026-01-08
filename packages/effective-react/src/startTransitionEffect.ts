import { Effect, Runtime } from 'effect';
import { startTransition } from 'react';
import { ReactContext } from './ReactContext';
import { SET_TRANSITION_SYMBOL } from './common/constants';

export function startTransitionEffect<R>(
  lambda: () => Effect.Effect<void, never, R>
): Effect.Effect<void, never, R | ReactContext> {
  return Effect.gen(function* () {
    const context = yield* ReactContext;
    const runtime = yield* Effect.runtime<R>();
    startTransition(async () => {
      context[SET_TRANSITION_SYMBOL](true);
      await Runtime.runPromise(runtime, lambda());
    });
  });
}