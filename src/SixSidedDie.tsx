import { Context, Effect } from "effect";
import { WithEffect } from "./effective-react/WithEffect";
import { CallbackEffect } from "./effective-react/CallbackEffect";
import * as StateRef from './effective-react/StateRef';
import { UseState } from "./effective-react/UseState";
import { UseRef } from "./effective-react/UseRef";

class Random extends Context.Tag("MyRandomService")<
  Random,
  { readonly next: Effect.Effect<number> }
>() {}

const SIDES = 6;
const useRenders = new UseState(Number());
const useRef = new UseRef<HTMLDivElement>();
const useSide = new UseState(Effect.gen(function* () {
  const random = yield* Random;
  return yield* random.next;
}));
export const SixSidedDie = WithEffect(() => {
  const effect = Effect.gen(function* () {
    const random = yield* Random;
    const ref = yield* useRef();
    const side = yield* useSide();
    const renders = yield* useRenders();
    yield* StateRef.update(renders, (n) => n + 1);
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
		next: Effect.sync(() => Math.floor(Math.random() * SIDES) + 1)
	})
});