import { Cause, Scope, Effect, Exit, Layer, Ref } from 'effect';
import { use, useReducer, useRef, startTransition, type JSX, type RefObject, memo, useEffect } from 'react';
import { ReactContext } from './ReactContext';
import { SET_TRANSITION_SYMBOL, FORCE_UPDATE_STEP, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from './common/constants';

interface State {
  promise?: Promise<JSX.Element | undefined>;
  controller?: AbortController;
  jsx?: JSX.Element;
  effect: Effect.Effect<JSX.Element, never, ReactContext | Scope.Scope>;
  scheduleUpdate: () => void;
  forceUpdate: React.ActionDispatch<[]>;
  transition: boolean;
  Refs?: Map<unknown, Ref.Ref<unknown>>;
  Scope?: Scope.CloseableScope;
  finaliserId?: number;
}

function RenderFactory() {
  return function render(
    state: RefObject<State>
  ) {
    state.current.Refs ??= new Map();
    state.current.controller ??= new AbortController();
    const signal = state.current.controller.signal;
    function setTransition(transition: boolean) {
      state.current.transition = transition;
    }
    return Effect.runPromiseExit(
      state.current.effect
        .pipe(
          Effect.provide(
            Layer.succeed(
              ReactContext,
              {
                [SCHEDULE_UPDATE_SYMBOL]: state.current.scheduleUpdate,
                [REFS_SYMBOL]: state.current.Refs,
                [SET_TRANSITION_SYMBOL]: setTransition,
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
        ),
      { signal }
    ).then(function onExit(exit) {
      if (Exit.isFailure(exit)) {
        if (!Cause.isInterrupted(exit.cause)) {
          throw exit.cause;
        }
        return state.current.jsx;
      } else {
        return exit.value;
      }
    });
  };
};

function finalise(state: RefObject<State>) {
  // unmount
  if (!state.current.Scope)
    return;
  Effect.runPromise(
    Scope.close(state.current.Scope, Exit.void)
  );
};

export function WithEffect<P extends object>(
  lambda: (props: P) => Effect.Effect<JSX.Element, never, ReactContext | Scope.Scope>
): Record<string, (props: P) => JSX.Element | undefined> {
  const render = RenderFactory();
  function reset(state: RefObject<State>) {
    state.current.promise = undefined;
    state.current.controller?.abort();
    state.current.controller = undefined;
    state.current.transition = false;
  };
  function rerender(state: RefObject<State>) {
    state.current.promise ??= render(
      state
    ).then(function onJSX(jsx) {
      const forceUpdate = state.current.forceUpdate;
      if (state.current.jsx) {
        state.current.jsx = jsx;
        if (state.current.transition)
          startTransition(forceUpdate);
        else
          forceUpdate();
      }

      return jsx;
    });
  };
  const store = new WeakMap<P, State>();
  function Component(props: P) {
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
        forceUpdate,
        effect,
        transition: false,
      });
    const propsChanged = !store.has(props);
    store.set(props, state.current);
    state.current.effect = effect;
    state.current.forceUpdate = forceUpdate;

    useEffect(() => {
      const currentState = state.current;
      clearTimeout(state.current.finaliserId);

      return () => {
        currentState.finaliserId = setTimeout(finalise.bind(null, state));
      };
    }, []);

    if (propsChanged) {
      reset(state);
    }
    if (state.current.jsx) {
      rerender(state);
      return state.current.jsx;
    } else {
      state.current.promise ??= render(state);
      const jsx = use(state.current.promise);
      state.current.jsx = jsx;

      return jsx;
    }
  }

  return new Proxy({} as Record<string, typeof Component>, {
    get(_, key) {
      return (
        Object.defineProperty(Component, 'name', { value: key })
      );
    },
  });
}