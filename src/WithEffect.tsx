import { Effect } from "effect";
import { Suspense, use, useEffect, type JSX, type ReactNode } from "react";

interface State {
	promise?: Promise<JSX.Element>;
	controller: AbortController;
	fallback?: ReactNode;
}

export function WithEffect<P extends object>(
	lambda: (props: P) => Effect.Effect<JSX.Element, never, never>
) {
	const state: State = {
		controller: new AbortController(),
	};
	const Inner = (props: P) => {
		const signal = state.controller.signal;
		state.promise ??= Effect
			.runPromise(lambda(props), { signal })
			.then(jsx => {
				state.fallback = jsx;
				return jsx;
			});
		const jsx = use(state.promise);
		const deps = Object.values(props);

		useEffect(() => {
			return () => {
				state.promise = undefined;
				state.controller.abort();
				state.controller = new AbortController();
			};
		}, deps);

		return jsx;
	}
	return function Component(props: P & { fallback?: ReactNode }) {
		const fallback = state.fallback ?? props.fallback;
		return (
			<Suspense fallback={fallback}>
				<Inner {...props} />
			</Suspense>
		);
	}
}