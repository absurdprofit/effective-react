import { Scope, Effect, Ref } from 'effect';
import { Transition } from './Transition';
import AsyncContext from '@webfill/async-context';
import { RenderContext } from './RenderContext';

export interface State<R> {
  promise?: Promise<R | undefined>;
  controller?: AbortController;
  result?: R;
  suspended: boolean;
  effect: Effect.Effect<R, never, RenderContext | Transition | Scope.Scope>;
  scheduleUpdate: () => void;
  forceUpdate: React.ActionDispatch<[]>;
  rendering: boolean;
  transition: boolean;
  Refs: Map<unknown, Ref.Ref<unknown>>;
  Scope?: Scope.CloseableScope;
  finaliserId?: number;
}

export const ASYNC_CONTEXT = new AsyncContext.Variable<State<unknown>>({ name: 'context' });