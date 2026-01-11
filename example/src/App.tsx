import { Suspense } from 'react';
// import { Persons } from './Persons';
import { Persons } from './Persons.effect';
import './App.css';


const length = 1000;
function App() {
  return (
    <div>
      <Suspense>
        <Persons length={length} />        
      </Suspense>
    </div>
  );
}

export default App;
