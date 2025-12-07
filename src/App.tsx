import { useState } from 'react';
import './App.css'
import { Figure } from './Figure'
import { SixSidedDie } from './SixSidedDie';

const GLOBAL = {
  renders: Number(),
};

const fallbackStyle = {
  width: '595px',
  height: '516px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <SixSidedDie />
      <Figure
        index={count}
        fallback={<div style={fallbackStyle}>Loading...</div>}
      />
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
        <button onClick={() => setCount(count - 1)}>Previous</button>
        <button onClick={() => setCount(count + 1)}>Next</button>
      </div>
      <p>Index in App: {count}</p>
      <p>Total renders so far in App: {++GLOBAL.renders}</p>
    </div>
  );
}

export default App
