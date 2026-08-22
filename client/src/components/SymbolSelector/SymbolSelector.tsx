import { AVAILABLE_SYMBOLS } from '../../types';

interface SymbolSelectorProps {
  selectedSymbol: string;
  takenSymbol?: string;
  onSelect: (symbol: string) => void;
  label?: string;
}

export default function SymbolSelector({
  selectedSymbol,
  takenSymbol,
  onSelect,
  label = 'choose your symbol',
}: SymbolSelectorProps) {
  return (
    <div className="card">
      <div className="card-title">{label}</div>

      <div className="symbol-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {AVAILABLE_SYMBOLS.map((sym) => {
          const isTaken = sym === takenSymbol;
          const isSelected = sym === selectedSymbol;
          return (
            <button
              key={sym}
              className={`symbol-btn ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
              onClick={() => !isTaken && onSelect(sym)}
              disabled={isTaken}
              title={sym}
              aria-label={`symbol ${sym}`}
            >
              {sym}
            </button>
          );
        })}
      </div>
    </div>
  );
}
