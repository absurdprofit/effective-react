import { Effect } from 'effect';
import * as StateRef from './StateRef';
import type { ReactContext } from './ReactContext';
import React, { createRef } from 'react';

type UseRef<A, R> = () => Effect.Effect<React.RefObject<A | null>, never, R>;
type UseRefConstructor = {
  new<A>(): UseRef<A, ReactContext>;
}

export const UseRef = function<A>() {
  const key = Symbol();

  return () => (
    Effect.gen(function* () {
      const ref = yield* StateRef.make<React.RefObject<A | null>>(
        key,
        createRef<A>()
      );
      return yield* StateRef.get(ref);
    })
  );
} as unknown as UseRefConstructor;
