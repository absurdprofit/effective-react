import { Effect } from 'effect';
import * as StateRef from './StateRef';

export function UseState<A, R = never>(initial: A | Effect.Effect<A, never, R>) {
  const key = Symbol();

  return () => (
    Effect.gen(function* () {
      if (Effect.isEffect(initial))
        initial = yield* initial;
      return yield* StateRef.make<A>(key, initial);
    })
  );
}
