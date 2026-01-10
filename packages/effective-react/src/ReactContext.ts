import { Context, Ref } from 'effect';
import type { PHASE_SYMBOL, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from './common/constants';
import { EffectiveComponentPhase } from './EffectiveComponentPhase';

export class ReactContext extends Context.Tag('effective-react/ReactContext')<
  ReactContext,
  {
    readonly [SCHEDULE_UPDATE_SYMBOL]: () => void;
    readonly [REFS_SYMBOL]: Map<unknown, Ref.Ref<unknown>>;
    readonly [PHASE_SYMBOL]: EffectiveComponentPhase;
  }
>() {};