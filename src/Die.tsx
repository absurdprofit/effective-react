import { Context, Effect } from "effect";
import { WithEffect } from "./effective-react/WithEffect";
import { CallbackEffect } from "./effective-react/CallbackEffect";

class Random extends Context.Tag("MyRandomService")<
  Random,
  { readonly next: Effect.Effect<number> }
>() {}

const SIDES = 6;
export const Die = WithEffect((_, StateRef) => {
  const effect = Effect.gen(function* () {
    const random = yield* Random;
    const side = yield* StateRef.make('side', yield* random.next);
    const renders = yield* StateRef.make('renders', Number());
    yield* StateRef.update(renders, (n) => n + 1);
    const onClick = yield* CallbackEffect(() => (
      Effect.gen(function* () {
        yield* StateRef.set(side, yield* random.next);
      })
    ));
    return (
      <div>
        <p>Die</p>
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