import { Effect, SynchronizedRef } from 'effect';
import { dual } from 'effect/Function';
import { ReactContext } from './ReactContext';
import { PHASE_SYMBOL, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from './common/constants';

function canUpdate(context: ReactContext['Type']) {
  return context[PHASE_SYMBOL] !== 'rendering';
}

const ARITY = 2;

export const make = <A>(
  key: unknown,
  value: A
): Effect.Effect<SynchronizedRef.SynchronizedRef<A>, never, ReactContext> => {
  return Effect.gen(function* () {
    const context = yield* ReactContext;
    const registry = context[REFS_SYMBOL];
    let ref;
    if (yield* Effect.sync(() => registry.has(key)))
      ref = yield* Effect.sync(() => registry.get(key) as SynchronizedRef.SynchronizedRef<A>);
    ref ??= yield* SynchronizedRef.make(value);
    yield* Effect.sync(() => registry.set(key, ref as SynchronizedRef.SynchronizedRef<unknown>));

    return ref;
  });
};

export const get = SynchronizedRef.get;

export const fencedGet: <A>(
  self: SynchronizedRef.SynchronizedRef<A>
) => Effect.Effect<A> = (self) => {
  return SynchronizedRef.updateAndGet(self, (value) => value);
};

export const set = dual<
  <A>(value: A) => (self: SynchronizedRef.SynchronizedRef<A>) => Effect.Effect<void, never, ReactContext>,
  <A>(self: SynchronizedRef.SynchronizedRef<A>, value: A) => Effect.Effect<void, never, ReactContext>
>(
  ARITY,
  <A>(self: SynchronizedRef.SynchronizedRef<A>, value: A) => {
    return Effect.gen(function* () {
      yield* SynchronizedRef.set(self, value);

      const context = yield* ReactContext;
      if (canUpdate(context)) {
        const ScheduleUpdate = context[SCHEDULE_UPDATE_SYMBOL];
        yield* Effect.sync(ScheduleUpdate);
      }
    });
  }
);

export const update = dual<
  <A>(f: (a: A) => A) => (self: SynchronizedRef.SynchronizedRef<A>) => Effect.Effect<void, never, ReactContext>,
  <A>(self: SynchronizedRef.SynchronizedRef<A>, f: (a: A) => A) => Effect.Effect<void, never, ReactContext>
>(
  ARITY,
  <A>(self: SynchronizedRef.SynchronizedRef<A>, f: (a: A) => A) => {
    return Effect.gen(function* () {
      yield* SynchronizedRef.update(self, f);

      const context = yield* ReactContext;
      if (canUpdate(context)) {
        const ScheduleUpdate = context[SCHEDULE_UPDATE_SYMBOL];
        yield* Effect.sync(ScheduleUpdate);
      }
    });
  }
);

export const updateEffect = dual<
  <A, R, E>(
    f: (a: A) => Effect.Effect<A, E, R>
  ) => (self: SynchronizedRef.SynchronizedRef<A>) => Effect.Effect<void, E, R | ReactContext>,
  <A, R, E>(
    self: SynchronizedRef.SynchronizedRef<A>,
    f: (a: A) => Effect.Effect<A, E, R>
  ) => Effect.Effect<void, E, R | ReactContext>
>(ARITY, (self, f) => {
    return Effect.gen(function* () {
      yield* SynchronizedRef.updateEffect(self, f);

      const context = yield* ReactContext;
      if (canUpdate(context)) {
        const ScheduleUpdate = context[SCHEDULE_UPDATE_SYMBOL];
        yield* Effect.sync(ScheduleUpdate);
      }
    });
  }
);