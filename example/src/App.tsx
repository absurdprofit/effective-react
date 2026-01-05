import { Suspense, useState, ViewTransition } from 'react';
import './App.css';
import { Figure } from './Figure.effect';
import { SixSidedDie } from './SixSidedDie.effect';
import { Clock, ClockFallback } from './Clock.effect';

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
      <h1>Effect + React</h1>
      <Suspense fallback={<ClockFallback />}>
        <Clock />
      </Suspense>
      <hr />
      <ViewTransition>
        <Suspense fallback={<ViewTransition key='title'><p>Six Sided Die</p></ViewTransition>}>
          <SixSidedDie />
        </Suspense>
      </ViewTransition>
      <hr />
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
