import { Effect, Layer, Ref } from "effect";
import { use, useReducer, type JSX, type ReactNode } from "react";
import { ReactContext, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from "./ReactContext";

interface State {
	promise?: Promise<JSX.Element>;
	controller?: AbortController;
	jsx?: ReactNode;
	forceUpdate: () => void;
	Refs?: Map<string, Ref.Ref<unknown>>;
}

export function WithEffect<P extends object>(
	lambda: (props: P) => Effect.Effect<JSX.Element, never, ReactContext>
) {
	const store = new WeakMap<P, State>();
	return function Component(props: P) {
		const [, forceUpdate] = useReducer((c) => c + 1, Number());
		const propsChanged = !store.has(props);
		const state = store.get(props) ?? { forceUpdate };
		store.set(props, state);
		if (propsChanged) {
			state.controller?.abort();
		}
		state.forceUpdate = () => {
			state.promise = undefined;
			state.controller?.abort();
			state.controller = undefined;
			forceUpdate();
		};

		state.Refs ??= new Map();
		state.controller ??= new AbortController();
		const signal = state.controller.signal;
		state.promise ??= Effect.runPromise(
			lambda(props)
				.pipe(
					Effect.provide(
						Layer.succeed(
							ReactContext,
							{
								[SCHEDULE_UPDATE_SYMBOL]: () => state.forceUpdate(),
								[REFS_SYMBOL]: state.Refs
							}
						)
					)
				),
			{ signal }
		);
		const jsx = use(state.promise);
		state.jsx = jsx;

		return jsx;
	}
}