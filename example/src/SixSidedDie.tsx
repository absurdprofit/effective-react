import { Context, Effect } from 'effect';
import { UseRef, UseState, StateRef, CallbackEffect, WithEffect } from '@absurdprofit/effective-react';

class Random extends Context.Tag('MyRandomService')<
  Random,
  { readonly next: Effect.Effect<number> }
>() { }

const SIDES = 6;
const SIDE_OFFSET = 1;
const useRenders = new UseState();
const useRef = new UseRef();
const useSide = new UseState();
export const { SixSidedDie } = WithEffect(() => {
  const effect = Effect.gen(function* () {
    const random = yield* Random;
    const ref = yield* useRef<HTMLDivElement>();
    const side = yield* useSide(random.next);
    const renders = yield* useRenders(Number());
    yield* StateRef.update(renders, (n) => ++n);
    const onClick = yield* CallbackEffect(() => (
      Effect.gen(function* () {
        yield* StateRef.set(side, yield* random.next);
      })
    ));

    return (
      <div ref={ref}>
        <p>Six Sided Die</p>
        <button onClick={onClick}>Roll!</button>
        <p>Side {yield* StateRef.get(side)}</p>
        <p>Renders so far {yield* StateRef.get(renders)}</p>
      </div>
    );
  });

  return Effect.provideService(effect, Random, {
    next: Effect.sync(() => Math.floor(Math.random() * SIDES) + SIDE_OFFSET),
  });
});