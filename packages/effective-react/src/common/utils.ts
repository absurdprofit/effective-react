export function promiseWithResolvers<A>() {
  let resolve: ((value: A | PromiseLike<A>) => void) | undefined;
  let reject: ((reason?: unknown) => void) | undefined;
  const promise = new Promise<A>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return {
    promise,
    reject: (reason: unknown) => reject?.(reason),
    resolve: (value: A) => resolve?.(value),
  };
}