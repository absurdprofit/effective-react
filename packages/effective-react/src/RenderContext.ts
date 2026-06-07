import { RefObject } from 'react';
import { Context, Ref } from 'effect';
import { RENDERING_SYMBOL, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from './common/constants';
import { State } from './AsyncContext';

export class RenderContext extends Context.Tag('effective-react/RenderContext')<
  RenderContext,
  {
    readonly [SCHEDULE_UPDATE_SYMBOL]: () => void;
    readonly [REFS_SYMBOL]: Map<unknown, Ref.Ref<unknown>>;
    readonly [RENDERING_SYMBOL]: boolean;
  }
>() {};

export function createRenderContext(state: RefObject<State<unknown>>) {
  return {
    [SCHEDULE_UPDATE_SYMBOL]: state.current.scheduleUpdate,
    [REFS_SYMBOL]: state.current.Refs,
    get [RENDERING_SYMBOL]() {
      return state.current.rendering;
    },
  };
}