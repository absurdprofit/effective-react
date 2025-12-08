import { Effect, Runtime } from "effect";

export function CallbackEffect<A extends unknown[], R>(
	lambda: (...args: A) => Effect.Effect<void, never, R>
) {
	return Effect.gen(function* () {
		const runtime = yield* Effect.runtime<R>();
		return yield* Effect.sync((...args: A) => {
			Runtime.runFork(runtime, lambda(...args));
		});
	});
}