import { Context, Effect } from 'effect';
import { SET_TRANSITION_SYMBOL } from './common/constants';

export class Transition extends Context.Tag('effective-react/Transition')<
    Transition,
    {
      [SET_TRANSITION_SYMBOL](transition: boolean): void;
    }
  >() {};

export const EnableTransition: Effect.Effect<void, never, Transition> =
  Effect.gen(function* () {
    const transition = yield* Transition;
    yield* Effect.sync(() => transition[SET_TRANSITION_SYMBOL](true));
  });
