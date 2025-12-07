import { FiberId, Effect, Ref } from "effect";
import { dual } from "effect/Function";

const FIBER_BRAND = Symbol('effective/FiberId');

/**
 * FiberIds will be compared at write time.
 * If fibers match (update in render) we skip re-render.
 * If not we force re-render to ensure effect re-computes correct JSX.
 * The recommended pattern is to call StateRef.make
 * at the top level of your effect similar to hooks in React.
 * Since users can call StateRef.make anywhere the best failure mode for
 * calling StateRef.make elsewhere is to force re-renders on all updates.
 * To omit the branding on a ref ensures all comparisons of FiberIds will be falsy.
 */
interface FiberStamped {
  [FIBER_BRAND]?: number;
}

export class StateRef {
  #forceUpdate;
  #registry = new Map<string, Ref.Ref<unknown>>;

  constructor(forceUpdate: () => void) {
    this.#forceUpdate = forceUpdate;
  }

  #getFiberId(value: unknown) {
    if (typeof value === 'object' && value !== null)
      return (value as FiberStamped)[FIBER_BRAND];
  }

  #fiberBrandRef<A>(ref: Ref.Ref<A>, fiberId: FiberId.FiberId) {
    if (!FiberId.isComposite(fiberId))
      (ref as unknown as FiberStamped)[FIBER_BRAND] = fiberId.id;
  }

  public make = <A>(key: string, value: A) => {
    const fiberBrandRef = this.#fiberBrandRef;
    const registry = this.#registry;
    return Effect.gen(function* () {
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

  public get = Ref.get;

  public set = dual<
    <A>(value: A) => (self: Ref.Ref<A>) => Effect.Effect<void>,
    <A>(self: Ref.Ref<A>, value: A) => Effect.Effect<void>
  >(
    2,
    <A>(self: Ref.Ref<A>, value: A) => {
      const getFiberId = this.#getFiberId;
      const forceUpdate = this.#forceUpdate;

      return Effect.gen(function* () {
        yield* Ref.set(self, value);

        const fiberId = yield* Effect.fiberId;
        if (FiberId.isComposite(fiberId) || getFiberId(self) !== fiberId.id) {
          yield* Effect.sync(forceUpdate);
        }
      });
    }
  );
}