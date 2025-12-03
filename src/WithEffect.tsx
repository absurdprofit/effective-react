import { Effect } from "effect";
import { use, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition, type JSX } from "react";

const GLOBAL = {
	effectRenders: Number(),
	memoRenders: Number(),
	renders: Number(),
};

// export function WithEffect<P extends object>(
// 	lambda: (props: P) => Effect.Effect<JSX.Element, never, never>
// ) {
// 	return function Component(props: P) {
// 		const [jsx, setJsx] = useState(<></>);
// 		const [, startTransition] = useTransition();

// 		useEffect(() => {
// 			const controller = new AbortController();
// 			const signal = controller.signal;
// 			const effect = lambda(props);
// 			startTransition(async () => {
// 				const jsx = await Effect.runPromise(effect, { signal });
// 				setJsx(jsx);
// 			});
// 			return () => controller.abort();
// 		}, Object.values(props));

// 		return jsx;
// 	}
// }

export function WithEffect<P extends object>(
	lambda: (props: P) => Effect.Effect<JSX.Element, never, never>
) {
	return function Component(props: P) {
		const promise = useRef(null);
		const jsx = promise.current ? use(promise.current) : null;

		useEffect(() => {
			const controller = new AbortController();
			const signal = controller.signal;
			const effect = lambda(props);
			promise.current = Effect.runPromise(effect, { signal });
			return () => controller.abort();
		}, Object.values(props));

		return jsx;
	}
}