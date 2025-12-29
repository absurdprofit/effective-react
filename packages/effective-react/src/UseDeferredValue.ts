import { Effect } from 'effect';
import * as StateRef from './StateRef';
import type { ReactContext } from './ReactContext';

type UseDeferredValue = <A>(
  value: A
) => Effect.Effect<A, never, ReactContext>;
type UseDeferredValueConstructor = {
  new(): UseDeferredValue;
}

export const UseDeferredValue = function() {
  const key = Symbol();

  return <A>(value: A, initial?: A) => (
    Effect.gen(function* () {
      // don't use nullish coalescing since initial can be null
      if (initial === undefined)
        initial = value;
      return yield* Effect.acquireRelease(
        Effect.gen(function* () {
          const state = yield* StateRef.make(key, initial);
          return yield* StateRef.get(state);
        }),
        () => Effect.gen(function* () {
          const state = yield* StateRef.make(key, initial);
          yield* StateRef.set(state, value);
        })
      );
    })
  );
} as unknown as UseDeferredValueConstructor;
