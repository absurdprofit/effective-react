import { Effect, Runtime } from 'effect';
import { startTransition } from 'react';
import { Transition } from './Transition';
import { SET_TRANSITION_SYMBOL } from './common/constants';

export function startTransitionEffect<R>(
  effect: Effect.Effect<void, never, R>
): Effect.Effect<void, never, R | Transition> {
  return Effect.gen(function* () {
    const transition = yield* Transition;
    const runtime = yield* Effect.runtime<R>();
    startTransition(async () => {
      transition[SET_TRANSITION_SYMBOL](true);
      await Runtime.runPromise(runtime, effect);
    });
  });
}