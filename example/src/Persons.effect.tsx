import { CallbackEffect, StateRef, UseStateRef, WithEffect } from '@absurdprofit/effective-react';
import { Data, Effect } from 'effect';
import { faker } from '@faker-js/faker';
import { Result } from './Result';
import { List, type RowComponentProps } from 'react-window';
import './Persons.css';

class Person extends Data.Class<{
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
}> {}

const generatePersons = (length: number) =>
  Effect.sync(() =>
    Array.from({ length: Number(length) }, () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      return new Person({
        id: faker.string.uuid(),
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
      });
    })
  );

const filterPersonsByName =
  (query: string) =>
    (persons: ReadonlyArray<Person>): Effect.Effect<ReadonlyArray<Person>> =>
      Effect.sync(() => {
        const q = query.toLowerCase();
        return persons.filter((p) =>
          p.fullName.toLowerCase().includes(q)
        );
      });

function Row({ index, style, persons, query }: RowComponentProps<{ persons: readonly Person[], query: string }>) {
  return (
    <div style={style}>
      <Result person={persons[index]} query={query} />
    </div>
  );
}

const usePersonsRef = new UseStateRef();
const useQueryRef = new UseStateRef();
const { Persons } = WithEffect(Effect.fn(function* ({ length }: { length: number }) {
  const persons = yield* usePersonsRef(generatePersons(length));
  const query = yield* useQueryRef('');

  const onChange = yield* CallbackEffect(
    Effect.fn(function* (event: React.ChangeEvent<HTMLInputElement>) {
      yield* StateRef.set(query, event.target.value);
    })
  );

  const current = yield* query.get;
  const filtered = yield* filterPersonsByName(current)(yield* persons.get);

  return (
    <div className='persons'>
      <h1>Effect + React</h1>
      <search>
        <span>
          Filter
        </span>
        <input value={current} onChange={onChange} />
      </search>
      <List
        rowComponent={Row}  
        rowCount={filtered.length}
        rowHeight={25}
        rowProps={{ persons: filtered, query: current }}
      />
    </div>
  );
}));

export { Persons };