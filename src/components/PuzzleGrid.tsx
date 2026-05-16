import { For, createMemo } from 'solid-js';
import type { JSX } from 'solid-js';
import type { CellValue, Step } from '../solver/types.ts';

type PuzzleGridProps = {
  grid: CellValue[][];
  size: number;
  cellSize: number;
  lastStep: Step | null;
  isCompleted: boolean;
};

export function PuzzleGrid(props: PuzzleGridProps): JSX.Element {
  const cellStyle = createMemo(
    () => ({ '--cell-size': `${props.cellSize}px`, '--grid-size': `${props.size}` }) as Record<string, string>,
  );

  function getCellClass(r: number, c: number, value: CellValue, step: Step | null): string {
    const classes = ['cell'];

    if (value === 1) {
      classes.push('cell--filled');
      if (step && step.row === r && step.col === c) {
        if (step.phase === 4) classes.push('cell--phase4');
        classes.push('cell--confirmed');
      }
    } else if (value === 0) {
      classes.push('cell--empty');
    }

    if (props.isCompleted) classes.push('cell--wave');

    return classes.join(' ');
  }

  return (
    <div
      class="puzzle-grid"
      style={{ '--grid-size': `${props.size}`, '--cell-size': `${props.cellSize}px`, ...cellStyle() }}
    >
      <For each={props.grid}>
        {(row, r) => (
          <For each={row}>
            {(cell, c) => (
              <div
                class={getCellClass(r(), c(), cell, props.lastStep)}
                style={{ '--row': `${r()}`, '--col': `${c()}` } as Record<string, string>}
              />
            )}
          </For>
        )}
      </For>
    </div>
  );
}
