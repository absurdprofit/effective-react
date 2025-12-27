import { Suspense, useState, ViewTransition } from 'react';
import './App.css';
import { Figure } from './Figure';
import { SixSidedDie } from './SixSidedDie';

const GLOBAL = new Proxy(
  { renders: Number() },
  {
    get(target, prop, receiver) {
      if (prop === 'renders') {
        target.renders++;
        return target.renders;
      }
      return Reflect.get(target, prop, receiver);
    },
  }
);

const fallbackStyle = {
  width: '595px',
  height: '516px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const INC = 1;
const Loading = <div style={fallbackStyle}>Loading...</div>;
function App() {
  const [count, setCount] = useState(Number());

  return (
    <div>
      <ViewTransition>
        <Suspense fallback={<div>Six Sided Die</div>}>
          <SixSidedDie />
        </Suspense>
      </ViewTransition>
      <Suspense fallback={Loading}>
        <Figure index={count} />
      </Suspense>
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
        <button onClick={() => setCount(count - INC)}>Previous</button>
        <button onClick={() => setCount(count + INC)}>Next</button>
      </div>
      <p>Index in App: {count}</p>
      <p>Total renders so far in App: {GLOBAL.renders}</p>
    </div>
  );
}

export default App;
