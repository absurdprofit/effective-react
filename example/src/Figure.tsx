import { ViewTransition } from 'react';
import { Effect } from 'effect';
import { EnableTransition, StateRef, UseDeferredValue, UseState, WithEffect } from '@absurdprofit/effective-react';
import { ALL_STATUS_CODES } from './constants';

const GLOBAL = {
  renders: Number(),
};

const SECOND_IN_MS = 1000;

interface Props {
  index: number;
}

const useDate = new UseState();
const usePrevStatusCode = new UseDeferredValue();
export const { Figure } = WithEffect(
  Effect.fn(function* (props: Props) {
    const statusCode = ALL_STATUS_CODES.at(props.index % ALL_STATUS_CODES.length);
    const prevStatusCode = yield* usePrevStatusCode(statusCode);
    yield* EnableTransition.pipe(
      Effect.when(() => (
        prevStatusCode !== statusCode
      ))
    );
    const date = yield* useDate(Effect.sync(() => new Date().toString()));
    const dog = yield* Effect.tryPromise({
      try: async (signal) => {
        const response = await fetch(`/api/dog/${statusCode}.jpg`, { signal });
        if (!response.ok)
          throw new Error('Unknown');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        return { url };
      },
      catch: (error) => error,
    }).pipe(
      Effect.catchAll(() => Effect.succeed({ url: '/api/dog/404.jpg' }))
    );

    yield* Effect.forkScoped(
      Effect.zip(
        Effect.sleep(SECOND_IN_MS),
        StateRef.set(date, new Date().toString())
      )
    );

    return (
      <div>
        <h1>Effect + React</h1>
        <p>Current date and time: {yield* StateRef.get(date)}</p>
        <p>Index from parent: {props.index}</p>
        <p>Status Code: {statusCode}</p>
        <p>Renders so far: {++GLOBAL.renders}</p>
        <ViewTransition key={'dog'}>
          <img src={dog.url} alt='Random Dog' width={300} height={300} />
        </ViewTransition>
      </div>
    );
  })
);