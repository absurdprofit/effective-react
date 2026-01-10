import { Suspense, useState, ViewTransition } from 'react';
import './App.css';
import { Figure } from './Figure.effect';
import { SixSidedDie } from './SixSidedDie.effect';
import { Clock, ClockFallback } from './Clock.effect';
import { Persons } from './Persons.effect';

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

function App() {
  return (
    <div>
      <Suspense fallback={<ClockFallback />}>
        <Persons length={Number('1000')} />        
      </Suspense>
    </div>
  );
}

export default App;
