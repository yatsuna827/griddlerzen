import { For } from 'solid-js';
import type { JSX } from 'solid-js';

type CluePanelProps = {
  clues: number[][];
  direction: 'row' | 'col';
  highlightIndex: number | null;
  confirmedClues: boolean[][];
  cellSize: number;
};

export function CluePanel(props: CluePanelProps): JSX.Element {
  return (
    <div class={`clue-panel clue-panel--${props.direction}`} style={{ '--cell-size': `${props.cellSize}px` }}>
      <For each={props.clues}>
        {(clue, i) => (
          <div class={`clue-line${props.highlightIndex === i() ? ' clue-line--highlight' : ''}`}>
            {clue.length === 0 ? (
              <span class="clue-num clue-num--zero">0</span>
            ) : (
              <For each={clue}>
                {(num, j) => (
                  <span class={`clue-num${props.confirmedClues[i()]?.[j()] ? ' clue-num--done' : ''}`}>{num}</span>
                )}
              </For>
            )}
          </div>
        )}
      </For>
    </div>
  );
}
