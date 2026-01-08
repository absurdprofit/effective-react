import { ViewTransition } from 'react';
import { Effect } from 'effect';
import { EnableTransition, UseDeferredValue, WithEffect } from '@absurdprofit/effective-react';
import { ALL_STATUS_CODES } from './constants';

const GLOBAL = {
  renders: Number(),
};

interface Props {
  index: number;
}

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

    return (
      <div>
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