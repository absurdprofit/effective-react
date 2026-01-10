import { Data } from 'effect';

/**
 * Domain model (same shape as before)
 */
export class Person extends Data.Class<{
  readonly id: string;
  readonly fullName: string;
}> {}

interface ResultProps {
  readonly person: Person;
  readonly query: string;
}

/**
 * Highlights the matched substring by wrapping it in <strong>
 */
export function Result({ person, query }: ResultProps) {
  if (!query) {
    return <li>{person.fullName}</li>;
  }

  const name = person.fullName;
  const lowerName = name.toLowerCase();
  const lowerQuery = query.toLowerCase();

  const index = lowerName.indexOf(lowerQuery);

  if (index === -1) {
    return <span>{name}</span>;
  }

  const before = name.slice(0, index);
  const match = name.slice(index, index + query.length);
  const after = name.slice(index + query.length);

  return (
    <li>
      {before}
      <strong>{match}</strong>
      {after}
    </li>
  );
}
