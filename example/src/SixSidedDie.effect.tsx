import { Context, Deferred, Effect } from 'effect';
import { UseRefObject, UseStateRef, StateRef, CallbackEffect, WithEffect, useDeferredCommit } from '@absurdprofit/effective-react';
import React, { ViewTransition } from 'react';

class Random extends Context.Tag('MyRandomService')<
  Random,
  { readonly next: Effect.Effect<number> }
>() { }

const SIDES = 6;
const SIDE_OFFSET = 1;
const useRenders = new UseStateRef();
const useRef = new UseRefObject();
const useSide = new UseStateRef();
export const { SixSidedDie } = WithEffect(() => {
  const { make } = useDeferredCommit();
  const effect = Effect.gen(function* () {
    const commit = yield* make();
    const random = yield* Random;
    const ref = yield* useRef<HTMLDivElement>();
    const side = yield* useSide(random.next);
    const renders = yield* useRenders(Number());
    yield* StateRef.update(renders, (n) => ++n);
    const onClick = yield* CallbackEffect(() => (
      Effect.gen(function* () {
        yield* StateRef.updateEffect(side, () => random.next);
      })
    ));
    yield* Effect.forkScoped(
      Effect.gen(function* () {
        console.log('before', ref);
        yield* Deferred.await(commit);
        console.log('after', ref);
      })
    );

    yield* Effect.sleep(1000);

    return (
      <div ref={ref}>
        <ViewTransition key='title'>
          <p>Six Sided Die</p>
        </ViewTransition>
        <button onClick={onClick}>Roll!</button>
        <p>Side {yield* side.get}</p>
        <p>Renders so far {yield* renders.get}</p>
      </div>
    );
  });

  return Effect.provideService(effect, Random, {
    next: Effect.sync(() => Math.floor(Math.random() * SIDES) + SIDE_OFFSET),
  });
});