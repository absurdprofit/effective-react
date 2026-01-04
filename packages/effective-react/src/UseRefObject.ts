import { Effect } from 'effect';
import * as StateRef from './StateRef';
import type { ReactContext } from './ReactContext';
import React, { createRef } from 'react';

type UseRefObject = <A>() =>
    Effect.Effect<React.RefObject<A | null>, never, ReactContext>;
type UseRefObjectConstructor = {
  new(): UseRefObject;
}

export const UseRefObject = function() {
  const key = Symbol();

  return <A>() => (
    Effect.gen(function* () {
      const ref = yield* StateRef.make<React.RefObject<A | null>>(
        key,
        createRef<A>()
      );
      return yield* StateRef.get(ref);
    })
  );
} as unknown as UseRefObjectConstructor;
