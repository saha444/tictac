import Cell from '../Cell/Cell';
import { GameState } from '../../types';

interface BoardProps {
  gameState: GameState;
  onCellClick: (index: number) => void;
  isMyTurn: boolean;
}

export default function Board({ gameState, onCellClick, isMyTurn }: BoardProps) {
  const { board, players, winningCells, status } = gameState;
  const isFinished = status === 'finished';
  const p1Symbol = players.player1.symbol;
  const p2Symbol = players.player2?.symbol ?? '○';
  const isGameActive = status === 'playing';

  return (
    <div
      className={`board ${isGameActive && isMyTurn ? 'board--glow' : ''}`}
      role="grid"
      aria-label="tic-tac-toe board"
    >
      {board.map((cellValue, idx) => {
        const isWinner = winningCells.includes(idx);
        const isDisabled = isFinished || !isMyTurn || !isGameActive;

        return (
          <Cell
            key={idx}
            value={cellValue}
            index={idx}
            p1Symbol={p1Symbol}
            p2Symbol={p2Symbol}
            isWinner={isWinner}
            isDisabled={isDisabled}
            onClick={onCellClick}
          />
        );
      })}
    </div>
  );
}
