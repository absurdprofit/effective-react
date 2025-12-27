import { FiberId, Effect, Ref } from 'effect';
import { dual } from 'effect/Function';
import { ReactContext } from './ReactContext';
import { REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from './common/constants';

const FIBER_ID_SYMBOL = Symbol('effective/FiberId');
const ARITY = 2;

/**
 * FiberIds will be compared at write time.
 * If fibers match (update in render) we skip re-render.
 * If not we force a re-render to ensure effect re-computes updated JSX.
 * The recommended pattern is to call StateRef.make
 * at the top level of your effect similar to hooks in React.
 * Since users can call StateRef.make anywhere the best failure mode for
 * calling StateRef.make elsewhere is to force re-renders on all updates.
 * To omit the branding on a ref ensures all comparisons of FiberIds will be falsy.
 */
interface FiberStamped {
  [FIBER_ID_SYMBOL]?: number;
}

function getFiberId(value: unknown) {
  if (typeof value === 'object' && value !== null)
    return (value as FiberStamped)[FIBER_ID_SYMBOL];
}

function fiberBrandRef<A>(ref: Ref.Ref<A>, fiberId: FiberId.FiberId) {
  if (!FiberId.isComposite(fiberId))
    (ref as unknown as FiberStamped)[FIBER_ID_SYMBOL] = fiberId.id;
}

export const make = <A>(
  key: unknown,
  value: A
): Effect.Effect<Ref.Ref<A>, never, ReactContext> => {
  return Effect.gen(function* () {
    const context = yield* ReactContext;
    const registry = context[REFS_SYMBOL];
    let ref;
    if (yield* Effect.sync(() => registry.has(key)))
      ref = yield* Effect.sync(() => registry.get(key) as Ref.Ref<A>);
    ref ??= yield* Ref.make(value);
    const fiberId = yield* Effect.fiberId;
    fiberBrandRef(ref, fiberId);
    yield* Effect.sync(() => registry.set(key, ref as Ref.Ref<unknown>));

    return ref;
  });
};

export const get = Ref.get;

export const set = dual<
  <A>(value: A) => (self: Ref.Ref<A>) => Effect.Effect<void, never, ReactContext>,
  <A>(self: Ref.Ref<A>, value: A) => Effect.Effect<void, never, ReactContext>
  // eslint-disable-next-line indent
>(
    // eslint-disable-next-line indent
  ARITY,
  <A>(self: Ref.Ref<A>, value: A) => {
    return Effect.gen(function* () {
      yield* Ref.set(self, value);

      const fiberId = yield* Effect.fiberId;
      if (FiberId.isComposite(fiberId) || getFiberId(self) !== fiberId.id) {
        const context = yield* ReactContext;
        const ScheduleUpdate = context[SCHEDULE_UPDATE_SYMBOL];
        yield* Effect.sync(ScheduleUpdate);
      }
    });
  }
  // eslint-disable-next-line indent
);

export const update = dual<
  <A>(f: (a: A) => A) => (self: Ref.Ref<A>) => Effect.Effect<void, never, ReactContext>,
  <A>(self: Ref.Ref<A>, f: (a: A) => A) => Effect.Effect<void, never, ReactContext>
  // eslint-disable-next-line indent
>(
    // eslint-disable-next-line indent
  ARITY,
  <A>(self: Ref.Ref<A>, f: (a: A) => A) => {
    return Effect.gen(function* () {
      yield* Ref.update(self, f);

      const fiberId = yield* Effect.fiberId;
      if (FiberId.isComposite(fiberId) || getFiberId(self) !== fiberId.id) {
        const context = yield* ReactContext;
        const ScheduleUpdate = context[SCHEDULE_UPDATE_SYMBOL];
        yield* Effect.sync(ScheduleUpdate);
      }
    });
  }
  // eslint-disable-next-line indent
);