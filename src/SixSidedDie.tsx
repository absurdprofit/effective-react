import { Context, Effect } from "effect";
import { WithEffect } from "./effective-react/WithEffect";
import { CallbackEffect } from "./effective-react/CallbackEffect";
import * as StateRef from './effective-react/StateRef';
import { createRef } from "react";

class Random extends Context.Tag("MyRandomService")<
  Random,
  { readonly next: Effect.Effect<number> }
>() {}

const SIDES = 6;
export const SixSidedDie = WithEffect(() => {
  const effect = Effect.gen(function* () {
    const random = yield* Random;
    const ref = yield* StateRef.make('ref', createRef<HTMLDivElement>());
    const side = yield* StateRef.make('side', yield* random.next);
    const renders = yield* StateRef.make('renders', Number());
    yield* StateRef.update(renders, (n) => n + 1);
    const onClick = yield* CallbackEffect(() => (
      Effect.gen(function* () {
        yield* StateRef.set(side, yield* random.next);
      })
    ));

    console.log('SixSidedDie', yield* StateRef.get(ref));
    return (
      <div ref={yield* StateRef.get(ref)}>
        <p>Six Sided Die</p>
        <button onClick={onClick}>Roll!</button>
				<p>Side {yield* StateRef.get(side)}</p>
				<p>Renders so far {yield* StateRef.get(renders)}</p>
      </div>
    );
  });

  return Effect.provideService(effect, Random, {
		next: Effect.sync(() => Math.floor(Math.random() * SIDES) + 1)
	})
});