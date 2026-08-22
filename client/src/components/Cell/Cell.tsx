import { useRef, useEffect } from 'react';
import { EMPTY, P1_VALUE } from '../../game/multiplicationEngine';

interface CellProps {
  value: number;
  index: number;
  p1Symbol: string;
  p2Symbol: string;
  isWinner: boolean;
  isDisabled: boolean;
  onClick: (index: number) => void;
}

export default function Cell({
  value,
  index,
  p1Symbol,
  p2Symbol,
  isWinner,
  isDisabled,
  onClick,
}: CellProps) {
  const prevValue = useRef<number>(EMPTY);
  const symbolRef = useRef<HTMLSpanElement>(null);

  const isEmpty = value === EMPTY;
  const isP1 = value === P1_VALUE;
  const symbol = isEmpty ? null : isP1 ? p1Symbol : p2Symbol;
  const playerClass = isEmpty ? '' : isP1 ? 'cell--p1' : 'cell--p2';
  const symbolClass = isEmpty
    ? ''
    : isWinner
    ? 'cell__symbol--winner'
    : isP1
    ? 'cell__symbol--p1'
    : 'cell__symbol--p2';

  useEffect(() => {
    if (value !== EMPTY && prevValue.current === EMPTY && symbolRef.current) {
      symbolRef.current.classList.remove('symbol-enter');
      void symbolRef.current.offsetWidth;
      symbolRef.current.classList.add('symbol-enter');
    }
    prevValue.current = value;
  }, [value]);

  function handleClick() {
    if (!isEmpty || isDisabled) return;
    onClick(index);
  }

  return (
    <button
      id={`cell-${index}`}
      className={[
        'cell',
        playerClass,
        isWinner ? 'cell--winner' : '',
        !isEmpty ? 'cell--occupied' : '',
        isDisabled && isEmpty ? 'cell--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      disabled={isDisabled && isEmpty}
      aria-label={
        isEmpty
          ? `empty cell ${index + 1}`
          : `cell ${index + 1}: ${symbol}`
      }
    >
      {symbol && (
        <span ref={symbolRef} className={`cell__symbol ${symbolClass}`}>
          {symbol}
        </span>
      )}
    </button>
  );
}
