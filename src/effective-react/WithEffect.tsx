import { Effect } from "effect";
import { Suspense, use, useDeferredValue, useRef, type JSX, type ReactNode, type RefObject } from "react";
import { diff } from "./common/utils";

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

		return jsx;
	}
	return function Component(props: P & { fallback?: ReactNode }) {
		const state = useRef<State>({});
		const prevProps = useDeferredValue(props);
		if (diff(Object.values(prevProps), Object.values(props))) {
			state.current.promise = undefined;
			state.current.controller?.abort();
			state.current.controller = undefined;
		}
		const fallback = state.current.fallback ?? props.fallback;
		return (
			<Suspense fallback={fallback}>
				<Inner props={props} state={state} />
			</Suspense>
		);
	}
}