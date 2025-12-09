import { Effect, Layer, Ref } from "effect";
import { use, useReducer, useRef, type JSX, type ReactNode } from "react";
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
		const state = useRef(store.get(props) ?? { forceUpdate });
		const propsChanged = !store.has(props);
		store.set(props, state.current);
		if (propsChanged) {
			state.current.promise = undefined;
			state.current.controller?.abort();
			state.current.controller = undefined;
		}
		state.current.forceUpdate = () => {
			state.current.promise = undefined;
			state.current.controller?.abort();
			state.current.controller = undefined;
			forceUpdate();
		};

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
		).then(jsx => {
			if (state.current.jsx) {
				state.current.jsx = jsx;
				forceUpdate();
			}

			return jsx;
		});

		if (state.current.jsx) {
			return state.current.jsx;
		} else {
			const jsx = use(state.current.promise);
			state.current.jsx = jsx;
			
			return jsx;
		}

	}
}