import { Cause, Scope, Effect, Exit, Layer, flow, Ref } from 'effect';
import { use, useReducer, useRef, startTransition, type RefObject, useEffect } from 'react';
import { SET_TRANSITION_SYMBOL, FORCE_UPDATE_STEP } from './common/constants';
import { Transition } from './Transition';
import { ASYNC_CONTEXT, State } from './AsyncContext';
import { createRenderContext, RenderContext } from './RenderContext';

type Environment =
  RenderContext
  | Transition
  | Scope.Scope

function RenderFactory<R>() {
  return function render(
    state: RefObject<State<R>>
  ) {
    function setTransition(transition: boolean) {
      state.current.transition = transition;
    }
    state.current.controller ??= new AbortController();
    const signal = state.current.controller.signal;
    const compose = flow(
      Effect.provide(
        Layer.succeed(
          RenderContext,
          createRenderContext(state)
        )
      ),
      Effect.provide(
        Layer.succeed(
          Transition,
          {
            [SET_TRANSITION_SYMBOL]: setTransition,
          }
        )
      ),
      Effect.provide(
        Layer.effect(Scope.Scope, Effect.gen(function* () {
          state.current.Scope ??= yield* Scope.make();

          return state.current.Scope;
        }))
      )
    );

    return Effect.runPromiseExit(
      compose(state.current.effect),
      { signal }
    ).then(function onExit(exit) {
      state.current.rendering = false;
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

export function WithEffect<P extends object, A, R extends Environment>(
  lambda: (props: P) => Effect.Effect<A, never, R>
): Record<string, (props: P) => A> {
  const render = RenderFactory<A>();
  function reset(state: RefObject<State<A>>) {
    state.current.promise = undefined;
    state.current.controller?.abort();
    state.current.controller = undefined;
    state.current.rendering = true;
  };
  function rerender(state: RefObject<State<A>>) {
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
  const store = new WeakMap<P, State<A>>();
  function ComponentOrHook(props: P) {
    const [, forceUpdate] = useReducer(function tick(t) {
      return t + FORCE_UPDATE_STEP;
    }, Number());
    
    const state = useRef(
      store.get(props)
      ?? {
        scheduleUpdate() {
          reset(state);
          rerender(state);
        },
        Refs: new Map<unknown, Ref.Ref<unknown>>(),
        rendering: true,
        forceUpdate,
        effect: null!,
        transition: false,
        suspended: true,
      });
    const effect = ASYNC_CONTEXT.run(
      state.current,
      () => lambda(props)
    );
    state.current.effect = effect;
    state.current.forceUpdate = forceUpdate;

    useEffect(() => {
      const currentState = state.current;
      clearTimeout(state.current.finaliserId);

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