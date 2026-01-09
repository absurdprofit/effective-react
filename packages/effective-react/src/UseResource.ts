import { Effect, ExecutionStrategy, Exit, Layer, Option, Scope } from 'effect';
import { UseRefObject } from './UseRefObject';

function depsEqual(a?: React.DependencyList, b?: React.DependencyList) {
  if (a === b)
    return false;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length
      && a.every((v, i) => Object.is(v, b[i]));
  return false;
}

type UseResource = <A, E, R, X, R2>(
  acquire: Effect.Effect<A, E, R>,
  release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<X, never, R2>,
  deps: React.DependencyList
) => Effect.Effect<A, E, Scope.Scope | R | R2>;
type UseResourceConstructor = {
  new(): UseResource;
}

interface State<A> {
  resource?: A,
  deps?: React.DependencyList,
  Scope?: Scope.CloseableScope;
}

export const UseResource = function() {
  const useRef = new UseRefObject();

  return <A, E, R, X, R2>(
    acquire: Effect.Effect<A, E, R>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<X, never, R2>,
    deps: React.DependencyList
  ) => (
    Effect.gen(function* () {
      const ref = yield* useRef<State<A>>();
      ref.current ??= {};
      const state = ref.current;

      const resource = yield* Effect.acquireRelease(
        acquire,
        release
      ).pipe(
        Effect.provide(
          Layer.effect(Scope.Scope, Effect.gen(function* () {
            if (state.Scope) {
              yield* Scope.close(state.Scope, Exit.void);
            }
            const parentScope = yield* Scope.Scope;
            const scope = yield* Scope.fork(
              parentScope,
              ExecutionStrategy.sequential
            );

            state.Scope = scope;
            return state.Scope;
          }))
        ),
        Effect.when(() => !depsEqual(state.deps, deps))
      );
      
      state.deps = deps;
      if (Option.isSome(resource))
        state.resource = resource.value;

      return state.resource!;
    })
  );
} as unknown as UseResourceConstructor;
