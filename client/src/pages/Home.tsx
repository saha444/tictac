import { useState } from 'react';
import SymbolSelector from '../components/SymbolSelector/SymbolSelector';
import { AVAILABLE_SYMBOLS } from '../types';
import type { Difficulty } from '../types';

interface HomeProps {
  onStartComputer: (symbol: string, difficulty: Difficulty) => void;
  onStartMultiplayer: (symbol: string) => void;
}

export default function Home({ onStartComputer, onStartMultiplayer }: HomeProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(AVAILABLE_SYMBOLS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  function handleStartComputer() {
    onStartComputer(selectedSymbol, difficulty);
  }

  function handleStartMultiplayer() {
    onStartMultiplayer(selectedSymbol);
  }

  return (
    <div className="page page-enter">
      <div className="logo text-center">
        <h1 className="logo__title">tic-tac-toe</h1>
      </div>

      <SymbolSelector
        selectedSymbol={selectedSymbol}
        onSelect={setSelectedSymbol}
        label="choose your symbol"
      />

      <div className="card">
        <div className="card-title">choose game mode</div>

        <div className="mode-buttons">
          <div>
            <div className="card-title" style={{ marginBottom: '8px' }}>difficulty</div>
            <div className="difficulty-pills">
              {(['easy', 'tricky'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  id={`btn-difficulty-${d}`}
                  className={`difficulty-pill ${difficulty === d ? `selected--${d === 'easy' ? 'easy' : 'hard'}` : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="section-sep" style={{ margin: '4px 0' }} />

          <button
            id="btn-play-computer"
            className="btn btn--primary"
            onClick={handleStartComputer}
          >
            play vs computer
          </button>

          <button
            id="btn-play-friend"
            className="btn btn--secondary"
            onClick={handleStartMultiplayer}
          >
            play with friend
          </button>
        </div>
      </div>
    </div>
  );
}
