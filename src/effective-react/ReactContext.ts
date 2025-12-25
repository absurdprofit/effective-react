import { Context, Ref } from "effect";

export const SCHEDULE_UPDATE_SYMBOL = Symbol('effective/ScheduleUpdate');
export const REFS_SYMBOL = Symbol('effective/Refs');
export const ENABLE_TRANSITION_SYMBOL = Symbol('effective/TransitionFlag');

export class ReactContext extends Context.Tag('effective/ReactContext')<
  ReactContext,
  {
    readonly [SCHEDULE_UPDATE_SYMBOL]: () => void;
    readonly [REFS_SYMBOL]: Map<unknown, Ref.Ref<unknown>>;
    [ENABLE_TRANSITION_SYMBOL]: (transition: boolean) => void;
  }
>() {};