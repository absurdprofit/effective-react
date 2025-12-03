import { Effect } from "effect";
import { WithEffect } from "./WithEffect";

const GLOBAL = {
	renders: Number(),
};

interface Props {
	count: number;
}
export const EffectiveComponent = WithEffect((props: Props) => (
	Effect.gen(function* () {
		const date = yield* Effect.sync(() => new Date());
		const dog = yield* Effect.tryPromise({
			try: async (signal) => {
				const response = await fetch('http://localhost', { signal });
				return response.json() as Promise<{ url: string }>;
				// return Promise.resolve({ url: 'http://localhost:3000' });
			},
			catch: (): never => ({ url: 'Failed to fetch dog image' }) as never,
		})

		return (
			<div>
				<h1>Effect + React</h1>
				<p>Current date and time: {date.toString()}</p>
				<p>Count from parent: {props.count}</p>
				<p>Renders so far: {++GLOBAL.renders}</p>
				<img src={dog.url} alt="Random Dog" width={300} height={300} />
			</div>
		);
	})
));