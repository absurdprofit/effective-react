import { StateRef, UseState, WithEffect } from '@absurdprofit/effective-react';
import { Effect } from 'effect';

const useDate = new UseState();
const SECOND_IN_MS = 1000;
export const { Clock } = WithEffect(
  Effect.fn(function* () {
    const date = yield* useDate(Effect.sync(() => new Date().toString()));
    yield* Effect.forkScoped(
      Effect.zip(
        Effect.sleep(SECOND_IN_MS),
        StateRef.set(date, new Date().toString())
      )
    );

    return (
      <div>
        <p>{yield* StateRef.get(date)}</p>
      </div>
    );
  })
);