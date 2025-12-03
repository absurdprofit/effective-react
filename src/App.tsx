import { Suspense, useState } from 'react';
import './App.css'
import { EffectiveComponent } from './Effective'

const GLOBAL = {
  renders: Number(),
};

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Suspense>
        <EffectiveComponent count={count} />
      </Suspense>
      <button onClick={() => setCount(count + 1)}>Next</button>
      <p>Total renders so far in App: {++GLOBAL.renders}</p>
    </div>
  );
}

export default App
