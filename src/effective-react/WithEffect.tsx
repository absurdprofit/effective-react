import { Effect } from "effect";
import { Suspense, use, useEffect, useRef, type JSX, type ReactNode, type RefObject } from "react";

interface State {
	promise?: Promise<JSX.Element>;
	controller?: AbortController;
	fallback?: ReactNode;
}

export function WithEffect<P extends object>(
	lambda: (props: P) => Effect.Effect<JSX.Element, never, never>
) {
	const Inner = ({ props, state }: { props: P, state: RefObject<State> }) => {
		state.current.controller ??= new AbortController();
		const signal = state.current.controller.signal;
		state.current.promise ??= Effect
			.runPromise(lambda(props), { signal })
			.then(jsx => {
				state.current.fallback = jsx;
				return jsx;
			});
		const jsx = use(state.current.promise);
		const deps = Object.values(props);

		useEffect(() => {
			const current = state.current;
			return () => {
				current.promise = undefined;
				current.controller?.abort();
				current.controller = undefined;
			};
		}, deps);

		return jsx;
	}
	return function Component(props: P & { fallback?: ReactNode }) {
		const state = useRef<State>({});
		const fallback = state.current.fallback ?? props.fallback;
		return (
			<Suspense fallback={fallback}>
				<Inner props={props} state={state} />
			</Suspense>
		);
	}
}