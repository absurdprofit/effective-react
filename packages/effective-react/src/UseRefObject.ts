import { Effect } from 'effect';
import * as StateRef from './StateRef';
import type { RenderContext } from './RenderContext';
import React, { createRef } from 'react';

type UseRefObject = <A>() =>
    Effect.Effect<React.RefObject<A | null>, never, RenderContext>;
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
