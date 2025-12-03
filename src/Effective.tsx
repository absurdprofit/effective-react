import { Effect } from "effect";
import { WithEffect } from "./WithEffect";

const GLOBAL = {
	renders: Number(),
};
const ALL_STATUS_CODES = [100, 101, 102, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511];

interface Props {
	index: number;
}
export const EffectiveComponent = WithEffect((props: Props) => (
	Effect.gen(function* () {
		const statusCode = ALL_STATUS_CODES[props.index % ALL_STATUS_CODES.length];
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