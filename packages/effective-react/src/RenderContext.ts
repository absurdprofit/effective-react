import { RefObject } from 'react';
import { Context, Ref } from 'effect';
import { PHASE_SYMBOL, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from './common/constants';
import { EffectiveComponentPhase } from './common/types';
import { State } from './AsyncContext';

export class RenderContext extends Context.Tag('effective-react/RenderContext')<
  RenderContext,
  {
    readonly [SCHEDULE_UPDATE_SYMBOL]: () => void;
    readonly [REFS_SYMBOL]: Map<unknown, Ref.Ref<unknown>>;
    readonly [PHASE_SYMBOL]: EffectiveComponentPhase;
  }
>() {};

export function createRenderContext(state: RefObject<State<unknown>>) {
  return {
    [SCHEDULE_UPDATE_SYMBOL]: state.current.scheduleUpdate,
    [REFS_SYMBOL]: state.current.Refs!,
    get [PHASE_SYMBOL]() {
      return state.current.phase;
    },
  };
}