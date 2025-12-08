import { Effect, Layer, Ref } from "effect";
import { Suspense, use, useDeferredValue, useReducer, useRef, type JSX, type ReactNode, type RefObject } from "react";
import { ReactContext, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from "./ReactContext";
import { diff } from "./common/utils";

interface State {
	promise?: Promise<JSX.Element>;
	controller?: AbortController;
	fallback?: ReactNode;
	forceUpdate: () => void;
	Refs?: Map<string, Ref.Ref<unknown>>;
}

export function WithEffect<P extends object>(
	lambda: (props: P) => Effect.Effect<JSX.Element, never, ReactContext>
) {
	const Inner = ({ props, state }: { props: P, state: RefObject<State> }) => {
		state.current.Refs ??= new Map();
		state.current.controller ??= new AbortController();
		const signal = state.current.controller.signal;
		state.current.promise ??= Effect.runPromise(
			lambda(props)
				.pipe(
					Effect.provide(
						Layer.succeed(
							ReactContext,
							{
								[SCHEDULE_UPDATE_SYMBOL]: () => state.current.forceUpdate(),
								[REFS_SYMBOL]: state.current.Refs
							}
						)
					)
				),
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