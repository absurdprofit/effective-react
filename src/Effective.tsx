import { Effect } from "effect";
import { WithEffect } from "./WithEffect";
import { ALL_STATUS_CODES } from "./constants";

const GLOBAL = {
	renders: Number(),
};

interface Props {
	index: number;
}
export const EffectiveComponent = WithEffect((props: Props) => (
	Effect.gen(function* () {
		const statusCode = ALL_STATUS_CODES.at(props.index % ALL_STATUS_CODES.length);
		const date = yield* Effect.sync(() => new Date());
		const dog = yield* Effect.tryPromise({
			try: async (signal) => {
				const response = await fetch(`/api/dog/${statusCode}.jpg`, { signal });
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				return { url };
			},
			catch: (): never => ({ url: 'Failed to fetch dog image' }) as never,
		});

		return (
			<div>
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