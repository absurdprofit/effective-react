import { Effect, Ref } from 'effect';
import * as StateRef from './StateRef';
import { ReactContext } from './ReactContext';
import { REFS_SYMBOL } from './common/constants';

type UseStateRef = <A, R = never>(
  initial: A | Effect.Effect<A, never, R>
) => Effect.Effect<Ref.Ref<A>, never, R | ReactContext>;
type UseStateRefConstructor = {
  new(): UseStateRef;
}

export const UseStateRef = function() {
  const key = Symbol();

  return <A, R = never>(initial: A | Effect.Effect<A, never, R>) => (
    Effect.gen(function* () {
      const context = yield* ReactContext;
      const registry = context[REFS_SYMBOL];
      if (yield* Effect.sync(() => registry.has(key))) {
        // initial is wrong here but with the above check we're certain it exists
        // in which case the initial value is ignored anyway
        return yield* StateRef.make<A>(key, initial as A);
      }
      if (Effect.isEffect(initial))
        initial = yield* initial;
      return yield* StateRef.make<A>(key, initial);
    })
  );
} as unknown as UseStateRefConstructor;
