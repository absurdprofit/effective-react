import { Effect } from 'effect';
import { ReactContext } from './ReactContext';
import { ENABLE_TRANSITION_SYMBOL } from './common/constants';

export const EnableTransition: Effect.Effect<void, never, ReactContext> =
  Effect.gen(function* () {
    const context = yield* ReactContext;
    yield* Effect.sync(() => context[ENABLE_TRANSITION_SYMBOL](true));
  });

export const DisableTransition: Effect.Effect<void, never, ReactContext> =
  Effect.gen(function* () {
    const context = yield* ReactContext;
    yield* Effect.sync(() => context[ENABLE_TRANSITION_SYMBOL](false));
  });