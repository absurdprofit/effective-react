import { Effect } from "effect";
import { use, useEffect, type JSX } from "react";

interface State {
	promise?: Promise<JSX.Element>;
	controller: AbortController;
}

export function WithEffect<P extends object>(
	lambda: (props: P) => Effect.Effect<JSX.Element, never, never>
) {
	const state: State = {
		controller: new AbortController(),
	};
	return function Component(props: P) {
		const signal = state.controller.signal;
		state.promise ??= Effect.runPromise(lambda(props), { signal });
		const jsx = use(state.promise);
		const deps = Object.values(props);

		useEffect(() => {
			return () => {
				state.promise = undefined;
				state.controller.abort();
				state.controller = new AbortController();
			}
		}, deps);

		return jsx;
	}
}