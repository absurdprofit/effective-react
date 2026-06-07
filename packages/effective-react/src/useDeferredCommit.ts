import { Deferred, Effect, Exit, flow, Layer, Runtime } from 'effect';
import React from 'react';
import { promiseWithResolvers } from './common/utils';
import { ASYNC_CONTEXT } from './AsyncContext';
import { createRenderContext, RenderContext } from './RenderContext';
import { Transition } from './Transition';
import { SET_TRANSITION_SYMBOL } from './common/constants';
import { UseRefObject } from './UseRefObject';

const RefObject = new UseRefObject();
export const useDeferredCommit = () => {
  const context = ASYNC_CONTEXT.get();
  if (!context)
    throw new ReferenceError('useDeferredCommit must be called in an effective component.');

  const compose = flow(
    Effect.provide(
      Layer.succeed(
        RenderContext,
        createRenderContext({ current: context })
      )
    ),
    Effect.provide(
      Layer.succeed(
        Transition,
        {
          [SET_TRANSITION_SYMBOL]: (transition) => context.transition = transition,
        }
      )
    )
  );

  React.useEffect(() => {
    Effect.runSync(
      compose(
        Effect.gen(function* () {
          const ref = yield* RefObject<ReturnType<typeof promiseWithResolvers<void>>>();
          ref.current?.resolve();
        })
      )
    );

    return () => {
      Effect.runSync(
        compose(
          Effect.gen(function* () {
            const ref = yield* RefObject<ReturnType<typeof promiseWithResolvers<void>>>();
            ref.current = promiseWithResolvers<void>();
          })
        )
      );
    };
  });

  return Effect.runSync(
    compose(
      Effect.gen(function* () {
        const ref = yield* RefObject<
          ReturnType<typeof promiseWithResolvers<void>>
        >();
        ref.current ??= promiseWithResolvers<void>();
        const deferred = yield* Deferred.make<void>();
        const runtime = yield* Effect.runtime();
        yield* Effect.sync(() => {
          Runtime.runPromise(
            runtime,
            Effect.gen(function* () {
              yield* Effect.promise(() => ref.current?.promise ?? Promise.resolve());
              yield* Deferred.done(deferred, Exit.void);
            })
          );
        });

        return deferred;
      })
    )
  );
};