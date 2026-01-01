import { Cause, Scope, Effect, Exit, Layer, Ref } from 'effect';
import { use, useReducer, useRef, startTransition, type JSX, type RefObject, memo, useEffect } from 'react';
import { ReactContext } from './ReactContext';
import { ENABLE_TRANSITION_SYMBOL, FORCE_UPDATE_STEP, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from './common/constants';

interface State {
  promise?: Promise<JSX.Element | undefined>;
  controller?: AbortController;
  jsx?: JSX.Element;
  rerender: () => void;
  transition: boolean;
  Refs?: Map<unknown, Ref.Ref<unknown>>;
  Scope?: Scope.CloseableScope;
  finaliserId?: number;
}

const RenderFactory = <P extends object,>(
  lambda: (props: P) => Effect.Effect<JSX.Element, never, ReactContext | Scope.Scope>
) => {
  return (
    props: P,
    state: RefObject<State>
  ) => {
    state.current.Refs ??= new Map();
    state.current.controller ??= new AbortController();
    const signal = state.current.controller.signal;
    return Effect.runPromiseExit(
      lambda(props)
        .pipe(
          Effect.provide(
            Layer.succeed(
              ReactContext,
              {
                [SCHEDULE_UPDATE_SYMBOL]: () => state.current.rerender(),
                [REFS_SYMBOL]: state.current.Refs,
                [ENABLE_TRANSITION_SYMBOL]: (transition: boolean) => {
                  state.current.transition = transition;
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
        ),
      { signal }
    ).then(exit => {
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

export function WithEffect<P extends object>(
  lambda: (props: P) => Effect.Effect<JSX.Element, never, ReactContext | Scope.Scope>
): Record<string, (props: P) => JSX.Element | undefined> {
  const render = RenderFactory(lambda);
  const store = new WeakMap<P, State>();
  function Component(props: P) {
    const [, forceUpdate] = useReducer((t) => t + FORCE_UPDATE_STEP, Number());
    const finalise = () => {
      // unmount
      if (!state.current.Scope)
        return;
      Effect.runPromise(
        Scope.close(state.current.Scope, Exit.void)
      );
    };

    const rerender = () => {
      state.current.promise ??= render(
        props,
        state
      ).then(jsx => {
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
    const state = useRef(store.get(props) ?? { rerender, transition: false });
    const propsChanged = !store.has(props);
    store.set(props, state.current);

    useEffect(() => {
      const currentState = state.current;
      clearTimeout(state.current.finaliserId);

      return () => {
        currentState.finaliserId = setTimeout(finalise);
      };
    }, []);

    state.current.rerender = () => {
      state.current.promise = undefined;
      state.current.controller?.abort();
      state.current.controller = undefined;
      state.current.transition = false;
      rerender();
    };

    if (propsChanged) {
      state.current.promise = undefined;
      state.current.controller?.abort();
      state.current.controller = undefined;
      state.current.transition = false;
    }
    if (state.current.jsx) {
      rerender();
      return state.current.jsx;
    } else {
      state.current.promise ??= render(props, state);
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