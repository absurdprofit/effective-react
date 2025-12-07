import { FiberId, Effect, Ref } from "effect";

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

export const make = <A>(value: A) => {
  return Effect.gen(function* () {
    const fiberId = yield* Effect.fiberId;
    const ref = yield* Ref.make(value);
    if (!FiberId.isComposite(fiberId))
      (ref as unknown as FiberStamped)[FIBER_BRAND] = fiberId.id;

    return ref;
  });
};

export const get = Ref.get;