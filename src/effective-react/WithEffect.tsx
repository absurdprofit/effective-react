import { Effect } from "effect";
import { Suspense, use, useDeferredValue, useReducer, useRef, type JSX, type ReactNode, type RefObject } from "react";
import { diff } from "./common/utils";
import { StateRef } from "./StateRef";

interface State {
	promise?: Promise<JSX.Element>;
	controller?: AbortController;
	fallback?: ReactNode;
	forceUpdate: () => void;
}

export function WithEffect<P extends object>(
	lambda: (props: P, StateRef: StateRef) => Effect.Effect<JSX.Element, never, never>
) {
	const Inner = ({ props, state }: { props: P, state: RefObject<State> }) => {
		const Ref = useRef(new StateRef(() => state.current.forceUpdate()));
		state.current.controller ??= new AbortController();
		const signal = state.current.controller.signal;
		state.current.promise ??= Effect.runPromise(
			lambda(props, Ref.current),
			{ signal }
		);
		const jsx = use(state.current.promise);
		state.current.fallback = jsx;

		return jsx;
	}
	return function Component(props: P & { fallback?: ReactNode }) {
		const [, forceUpdate] = useReducer((c) => c + 1, Number());
		const state = useRef<State>({ forceUpdate });
		const prevProps = useDeferredValue(props);
		if (diff(Object.values(prevProps), Object.values(props))) {
			state.current.promise = undefined;
			state.current.controller?.abort();
			state.current.controller = undefined;
		}
		const fallback = state.current.fallback ?? props.fallback;
		state.current.forceUpdate = () => {
			state.current.promise = undefined;
			state.current.controller?.abort();
			state.current.controller = undefined;
			forceUpdate();
		};

		return (
			<Suspense fallback={fallback}>
				<Inner props={props} state={state} />
			</Suspense>
		);
	}
}