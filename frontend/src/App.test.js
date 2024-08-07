import React from 'react';
import './App.css';
import FinVueAnalysis from './components/FinVueAnalysis'; // Adjust the path according to your project structure

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to FinVue Analysis</h1>
      </header>
      <main>
        <FinVueAnalysis />
      </main>
    </div>
  );
}

export default App;
