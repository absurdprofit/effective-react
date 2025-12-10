import { Cause, Effect, Exit, Layer, Ref } from "effect";
import { use, useReducer, useRef, type JSX, type RefObject } from "react";
import { ReactContext, REFS_SYMBOL, SCHEDULE_UPDATE_SYMBOL } from "./ReactContext";
import { FORCE_UPDATE_STEP } from "./common/constants";

interface State {
	promise?: Promise<JSX.Element | undefined>;
	controller?: AbortController;
	jsx?: JSX.Element;
	rerender: () => void;
	Refs?: Map<string, Ref.Ref<unknown>>;
}

const RenderFactory = <P extends object,>(
	lambda: (props: P) => Effect.Effect<JSX.Element, never, ReactContext>
) => {
	return (
		props: P,
		state: RefObject<State>,
	) => {
		state.current.Refs ??= new Map();
		state.current.controller ??= new AbortController();
		const signal = state.current.controller.signal;
		return Effect.runPromiseExit(
			lambda(props)
				.pipe(
					Effect.provide(
						Layer.succeed(
							ReactContext,
							{
								[SCHEDULE_UPDATE_SYMBOL]: () => state.current.rerender(),
								[REFS_SYMBOL]: state.current.Refs
							}
						)
					)
				),
			{ signal }
		).then(exit => {
			if (Exit.isFailure(exit)) {
				if (!Cause.isInterrupted(exit.cause)) {
					throw exit.cause;
				}
				return state.current.jsx;
			} else {
				return exit.value;
			}
		});
	};
}

export function WithEffect<P extends object>(
	lambda: (props: P) => Effect.Effect<JSX.Element, never, ReactContext>
) {
	const render = RenderFactory(lambda);
	const store = new WeakMap<P, State>();
	return function Component(props: P) {
		const [, forceUpdate] = useReducer((t) => t + FORCE_UPDATE_STEP, Number());
		const rerender = () => {
			state.current.promise ??= render(
				props,
				state,
			).then(jsx => {
				if (state.current.jsx) {
					state.current.jsx = jsx;
					forceUpdate();
				}

				return jsx;
			});
		};
		const state = useRef(store.get(props) ?? { rerender });
		const propsChanged = !store.has(props);
		store.set(props, state.current);

		state.current.rerender = () => {
			state.current.promise = undefined;
			state.current.controller?.abort();
			state.current.controller = undefined;
			rerender();
		};

		if (propsChanged) {
			state.current.promise = undefined;
			state.current.controller?.abort();
			state.current.controller = undefined;
		}
		if (state.current.jsx) {
			rerender();
			return state.current.jsx;
		} else {
			state.current.promise ??= render(props, state);
			const jsx = use(state.current.promise);
			state.current.jsx = jsx;
			
			return jsx;
		}

	}
}