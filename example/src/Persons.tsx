import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { faker } from '@faker-js/faker';
import { List, type RowComponentProps } from 'react-window';
import { Result } from './Result';
import './Persons.css';

function useDeferredValue<A>(value: A) {
  const [deferred, setDeferred] = useState(value);

  useEffect(() => {
    if (deferred === value)
      return;
    startTransition(() => setDeferred(value));
  }, [value, deferred]);

  return deferred;
}
/* ---------- model ---------- */

class Person {
  public readonly id: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly fullName: string;

  constructor(firstName: string, lastName: string) {
    this.id = faker.string.uuid();
    this.firstName = firstName;
    this.lastName = lastName;
    this.fullName = `${firstName} ${lastName}`;
  }
}

/* ---------- helpers ---------- */

function generatePersons(length: number): Person[] {
  return Array.from({ length }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return new Person(firstName, lastName);
  });
}

function filterPersonsByName(query: string, persons: readonly Person[]) {
  const q = query.toLowerCase();
  return persons.filter(p =>
    p.fullName.toLowerCase().includes(q)
  );
}

/* ---------- row ---------- */

function Row({
  index,
  style,
  persons,
  query,
}: RowComponentProps<{ persons: readonly Person[]; query: string }>) {
  return (
    <div style={style}>
      <Result person={persons[index]} query={query} />
    </div>
  );
}

/* ---------- component ---------- */

interface PersonsProps {
  readonly length: number;
}

export function Persons({ length }: PersonsProps) {
  // replaces UseStateRef(generatePersons)
  const [persons] = useState<Person[]>(() => generatePersons(length));

  // replaces UseStateRef('')
  const [query, setQuery] = useState('');

  // replaces CallbackEffect + StateRef.set
  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
    },
    []
  );

  // replaces Effect-based derived computation
  const filtered = useDeferredValue(
    useMemo(() => {
      return filterPersonsByName(query, persons);
    }, [query, persons])
  );

  return (
    <div className="persons">
      <h1>React</h1>

      <search>
        <span>Filter</span>
        <input value={query} onChange={onChange} />
      </search>

      <List
        rowComponent={Row}
        rowCount={filtered.length}
        rowHeight={25}
        rowProps={{ persons: filtered, query }}
      />
    </div>
  );
}
