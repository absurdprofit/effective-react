import { Effect, Ref } from 'effect';
import * as StateRef from './StateRef';
import type { ReactContext } from './ReactContext';

type UseState = <A, R = never>(
  initial: A | Effect.Effect<A, never, R>
) => Effect.Effect<Ref.Ref<A>, never, R | ReactContext>;
type UseStateConstructor = {
  new(): UseState;
}

export const UseState = function() {
  const key = Symbol();

  let _initial;
  return <A, R = never>(initial: A | Effect.Effect<A, never, R>) => (
    Effect.gen(function* () {
      _initial ??= initial;
      if (Effect.isEffect(_initial))
        _initial = yield* _initial;
      return yield* StateRef.make<A>(key, _initial);
    })
  );
} as unknown as UseStateConstructor;
