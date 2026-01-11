import { Deferred, Effect, Exit, Runtime } from 'effect';
import { ReactContext } from './ReactContext';
import { PHASE_SYMBOL } from './common/constants';

export const useDeferredCommit = Effect.fn(function* () {
  const deferred = yield* Deferred.make<void>();
  const context = yield* ReactContext;
  const runtime = yield* Effect.runtime();
  yield* Effect.promise(async () => {
    if (context[PHASE_SYMBOL].current === 'committed')
      await Runtime.runPromise(
        runtime,
        Deferred.done(deferred, Exit.void)
      );
    else
      context[PHASE_SYMBOL].addEventListener('committed', async () => {
        await Runtime.runPromise(
          runtime,
          Deferred.done(deferred, Exit.void)
        );
      });
  });

  return deferred;
});