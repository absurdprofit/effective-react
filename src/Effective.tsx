import { Console, Effect } from "effect";
import { WithEffect } from "./effective-react/WithEffect";
import { ALL_STATUS_CODES } from "./constants";
import { Callback } from "./effective-react/Callback";
import type { MouseEvent } from "react";

const GLOBAL = {
	renders: Number(),
};

interface Props {
	index: number;
}

export const EffectiveComponent = WithEffect((props: Props) => (
	Effect.gen(function* () {
		const onClick = yield* Callback((event: MouseEvent) => (
			Effect.gen(function* () {
				yield* Console.log('Button Click but in a generator', event);
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
				<h1>Effect + React</h1>
				<p>Current date and time: {date.toString()}</p>
				<p>Index from parent: {props.index}</p>
				<p>Status Code: {statusCode}</p>
				<p>Renders so far: {++GLOBAL.renders}</p>
				<img src={dog.url} alt="Random Dog" width={300} height={300} />
			</div>
		);
	})
));