import { Context, Effect } from "effect";
import { WithEffect } from "./effective-react/WithEffect";
import { ALL_STATUS_CODES } from "./constants";
import { CallbackEffect } from "./effective-react/CallbackEffect";

const GLOBAL = {
	renders: Number(),
};

interface Props {
	index: number;
}

class Random extends Context.Tag("MyRandomService")<
  Random,
  { readonly next: Effect.Effect<number> }
>() {}

export const EffectiveComponent = WithEffect((props: Props, StateRef) => {
	const effect = Effect.gen(function* () {
		const state = yield* StateRef.make('state', 0);
		const onClick = yield* CallbackEffect(() => (
			Effect.gen(function* () {
				const random = yield* Random;
				yield* StateRef.set(state, (yield* random.next) * ALL_STATUS_CODES.length);
			})
		));
		const statusCode = ALL_STATUS_CODES.at(props.index % ALL_STATUS_CODES.length);
		const date = yield* Effect.sync(() => new Date());
		const dog = yield* Effect.tryPromise({
			try: async (signal) => {
				const response = await fetch(`/api/dog/${statusCode}.jpg`, { signal });
				if (!response.ok)
					throw new Error('Unknown');
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				return { url };
			},
			catch: (error) => error
		}).pipe(
			Effect.catchAll(() => Effect.succeed({ url: '/api/dog/404.jpg' }))
		);

		return (
			<div>
				<button onClick={onClick}>Click Me!</button>
				<p>State {yield* StateRef.get(state)}</p>
				<h1>Effect + React</h1>
				<p>Current date and time: {date.toString()}</p>
				<p>Index from parent: {props.index}</p>
				<p>Status Code: {statusCode}</p>
				<p>Renders so far: {++GLOBAL.renders}</p>
				<img src={dog.url} alt="Random Dog" width={300} height={300} />
			</div>
		);
	});
	
	return Effect.provideService(effect, Random, {
		next: Effect.sync(() => Math.random())
	});
});