import { Context, Ref } from 'effect';
import type { ENABLE_TRANSITION_SYMBOL, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from './common/constants';

export class ReactContext extends Context.Tag('effective/ReactContext')<
  ReactContext,
  {
    readonly [SCHEDULE_UPDATE_SYMBOL]: () => void;
    readonly [REFS_SYMBOL]: Map<unknown, Ref.Ref<unknown>>;
    [ENABLE_TRANSITION_SYMBOL]: (transition: boolean) => void;
  }
>() {};