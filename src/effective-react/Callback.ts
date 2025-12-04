import { Effect } from "effect";

export function Callback<A extends unknown[]>(
	lambda: (...args: A) => Effect.Effect<void, never, never>
) {
	return Effect.succeed((...args: A) => {
		Effect.runPromise(lambda(...args));
	});
}