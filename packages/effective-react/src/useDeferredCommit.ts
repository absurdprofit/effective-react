import { Deferred, Effect, Exit, Runtime } from 'effect';
import React from 'react';
import { promiseWithResolvers } from './common/utilts';

export const useDeferredCommit = () => {
  const callback = React.useRef<() => Effect.Effect<Deferred.Deferred<void, never>>>(null!);
  const promise = React.useRef(promiseWithResolvers<void>());

  React.useEffect(() => {
    promise.current.resolve();
  });

  callback.current = Effect.fn(function* () {
    const deferred = yield* Deferred.make<void>();
    const runtime = yield* Effect.runtime();
    yield* Effect.sync(() => {
      Runtime.runPromise(
        runtime,
        Effect.gen(function* () {
          yield* Effect.promise(() => promise.current.promise);
          yield* Deferred.done(deferred, Exit.void);
        })
      );
    });

    return deferred;
  });

  return {
    make: React.useCallback(() => {
      return callback.current();
    }, []),
  };
};