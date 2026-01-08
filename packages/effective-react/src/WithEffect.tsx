import { Cause, Scope, Effect, Exit, Layer, Ref, flow } from 'effect';
import { use, useReducer, useRef, startTransition, type RefObject, useEffect } from 'react';
import { ReactContext } from './ReactContext';
import { SET_TRANSITION_SYMBOL, FORCE_UPDATE_STEP, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL, PHASE_SYMBOL } from './common/constants';
import { EffectiveComponentPhase } from './common/types';

interface State<R> {
  promise?: Promise<R | undefined>;
  controller?: AbortController;
  result?: R;
  suspended: boolean;
  effect: Effect.Effect<R, never, ReactContext | Scope.Scope>;
  scheduleUpdate: () => void;
  forceUpdate: React.ActionDispatch<[]>;
  phase: EffectiveComponentPhase;
  transition: boolean;
  Refs?: Map<unknown, Ref.Ref<unknown>>;
  Scope?: Scope.CloseableScope;
  finaliserId?: number;
}

function RenderFactory<R>() {
  return function render(
    state: RefObject<State<R>>
  ) {
    function setTransition(transition: boolean) {
      state.current.transition = transition;
    }
    state.current.Refs ??= new Map();
    state.current.controller ??= new AbortController();
    const signal = state.current.controller.signal;
    const compose = flow(
      Effect.provide(
        Layer.succeed(
          ReactContext,
          {
            [SCHEDULE_UPDATE_SYMBOL]: state.current.scheduleUpdate,
            [REFS_SYMBOL]: state.current.Refs,
            [SET_TRANSITION_SYMBOL]: setTransition,
            get [PHASE_SYMBOL]() {
              return state.current.phase;
            },
          }
        )
      ),
      Effect.provide(
        Layer.effect(Scope.Scope, Effect.gen(function* () {
          if (state.current.Scope)
            yield* Scope.close(state.current.Scope, Exit.void);
          state.current.Scope = yield* Scope.make();

          return state.current.Scope;
        }))
      )
    );
    return Effect.runPromiseExit(
      compose(state.current.effect),
      { signal }
    ).then(function onExit(exit) {
      state.current.phase = 'committing';
      if (Exit.isFailure(exit)) {
        if (!Cause.isInterrupted(exit.cause)) {
          throw exit.cause;
        }
        return state.current.result;
      } else {
        return exit.value;
      }
    });
  };
};

function finalise(state: RefObject<State<unknown>>) {
  // unmount
  if (!state.current.Scope)
    return;
  Effect.runPromise(
    Scope.close(state.current.Scope, Exit.void)
  );
};

export function WithEffect<P extends object, R>(
  lambda: (props: P) => Effect.Effect<R, never, ReactContext | Scope.Scope>
): Record<string, (props: P) => R> {
  const render = RenderFactory<R>();
  function reset(state: RefObject<State<R>>) {
    state.current.promise = undefined;
    state.current.controller?.abort();
    state.current.controller = undefined;
    state.current.phase = 'rendering';
  };
  function rerender(state: RefObject<State<R>>) {
    state.current.promise ??= render(
      state
    ).then(function onResult(result) {
      const forceUpdate = state.current.forceUpdate;
      if (state.current.result) {
        state.current.result = result;
        if (state.current.transition)
          startTransition(forceUpdate);
        else
          forceUpdate();

        state.current.transition = false;
      }

      return result;
    });
  };
  const store = new WeakMap<P, State<R>>();
  function ComponentOrHook(props: P) {
    const [, forceUpdate] = useReducer(function tick(t) {
      return t + FORCE_UPDATE_STEP;
    }, Number());
    
    const effect = lambda(props);
    const state = useRef(
      store.get(props)
      ?? {
        scheduleUpdate() {
          reset(state);
          rerender(state);
        },
        phase: 'rendering' as const,
        forceUpdate,
        effect,
        transition: false,
        suspended: true,
      });
    state.current.effect = effect;
    state.current.forceUpdate = forceUpdate;

    useEffect(() => {
      const currentState = state.current;
      clearTimeout(state.current.finaliserId);
      currentState.phase = 'committed' as const;

      return () => {
        currentState.finaliserId = setTimeout(finalise.bind(null, state));
      };
    }, []);

    const propsChanged = !store.has(props);
    if (propsChanged) {
      store.set(props, state.current);
      reset(state);
    }
    if (state.current.result) {
      rerender(state);
      return state.current.result;
    } else {
      state.current.promise ??= render(state);
      const result = use(state.current.promise);
      state.current.suspended = false;
      state.current.result = result;

      return result!;
    }
  }

  return new Proxy({} as Record<string, typeof ComponentOrHook>, {
    get(_, key) {
      return (
        Object.defineProperty(ComponentOrHook, 'name', { value: key })
      );
    },
  });
}