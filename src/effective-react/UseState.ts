import { Effect, Ref } from 'effect';
import * as StateRef from './StateRef';
import type { ReactContext } from './ReactContext';

type UseState<A, R> = () => Effect.Effect<Ref.Ref<A>, never, R>;
type UseStateConstructor = {
  new<A, R = never>(
    initial: A | Effect.Effect<A, never, R>
  ): UseState<A, R | ReactContext>;
}

export const UseState = function<A, R = never>(
  initial: A | Effect.Effect<A, never, R>
) {
  const key = Symbol();

  return () => (
    Effect.gen(function* () {
      if (Effect.isEffect(initial))
        initial = yield* initial;
      return yield* StateRef.make<A>(key, initial);
    })
  );
} as unknown as UseStateConstructor;
