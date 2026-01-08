import { StateRef, UseStateRef, WithEffect } from '@absurdprofit/effective-react';
import { Effect } from 'effect';

const useDate = new UseStateRef();
const SECOND_IN_MS = 1000;
const { Clock } = WithEffect(
  Effect.fn(function* () {
    const date = yield* useDate(Effect.sync(() => new Date()));
    const currentDate = (yield* StateRef.get(date));
    const duration = SECOND_IN_MS - (Date.now() - currentDate.getTime());
    yield* Effect.forkScoped(
      Effect.zip(
        Effect.sleep(duration),
        StateRef.set(date, new Date())
      )
    );

    return (
      <div>
        <p>{currentDate.toString()}</p>
      </div>
    );
  })
);

function ClockFallback() {
  return (
    <div>
      <p>{new Date().toString()}</p>
    </div>
  );
}

export { Clock, ClockFallback };