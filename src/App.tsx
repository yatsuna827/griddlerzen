import { For, batch, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import './App.css';
import { CluePanel } from './components/CluePanel.tsx';
import { PuzzleGrid } from './components/PuzzleGrid.tsx';
import { PUZZLES } from './puzzles/index.ts';
import { getConfirmedClueIndices } from './solver/lineAnalyzer.ts';
import { solve } from './solver/solver.ts';
import type { CellValue, Puzzle, Step } from './solver/types.ts';

// ==============================
// ヘルパー
// ==============================

function buildGridFromSteps(puzzle: Puzzle, steps: Step[], upTo: number): CellValue[][] {
  const grid: CellValue[][] = Array.from({ length: puzzle.size }, () =>
    Array.from({ length: puzzle.size }, (): null => null),
  );
  for (let i = 0; i < upTo; i++) {
    const s = steps[i];
    grid[s.row][s.col] = s.value;
  }
  return grid;
}

// ==============================
// App コンポーネント
// ==============================

const SPEED_OPTIONS = [
  { label: 'ゆっくり', ms: 200 },
  { label: 'さくさく', ms: 67 },
] as const;

const ALL_PUZZLES: Puzzle[] = PUZZLES;
let puzzleIndex = Math.floor(Math.random() * ALL_PUZZLES.length);
function nextPuzzle(): Puzzle {
  puzzleIndex = (puzzleIndex + 1) % ALL_PUZZLES.length;
  return ALL_PUZZLES[puzzleIndex];
}

const App = () => {
  const [puzzle, setPuzzle] = createSignal<Puzzle>(ALL_PUZZLES[puzzleIndex]);
  const [steps, setSteps] = createSignal<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = createSignal(0);
  const [speed, setSpeed] = createSignal(200);
  const [isCompleted, setIsCompleted] = createSignal(false);

  // グリッドを currentStepIndex から計算
  const displayGrid = createMemo<CellValue[][]>(() => buildGridFromSteps(puzzle(), steps(), currentStepIndex()));

  // 現在のステップ（最後に適用されたステップ）
  const currentStep = createMemo<Step | null>(() => {
    const idx = currentStepIndex();
    const s = steps();
    return idx > 0 && idx <= s.length ? s[idx - 1] : null;
  });

  // ハイライト行・列
  const highlightRow = createMemo<number | null>(() => {
    const step = currentStep();
    if (!step) return null;
    return step.sourceAxis === 'row' ? step.sourceIndex : null;
  });

  const highlightCol = createMemo<number | null>(() => {
    const step = currentStep();
    if (!step) return null;
    return step.sourceAxis === 'col' ? step.sourceIndex : null;
  });

  // 各クルー番号が確定済みかを boolean[][] で管理
  const confirmedRowClues = createMemo(() => {
    const grid = displayGrid();
    return puzzle().rowClues.map((clue, i) => getConfirmedClueIndices(clue, grid[i]));
  });

  const confirmedColClues = createMemo(() => {
    const grid = displayGrid();
    const p = puzzle();
    return p.colClues.map((clue, j) =>
      getConfirmedClueIndices(
        clue,
        grid.map((row) => row[j]),
      ),
    );
  });

  // 列ヒントの最大クルー数（列ヒントエリアの高さ固定に使用）
  const maxColClues = createMemo(() => Math.max(1, ...puzzle().colClues.map((c) => c.length)));

  // 行ヒントの最大クルー数（行ヒントエリアの幅固定に使用）
  const maxRowClues = createMemo(() => Math.max(1, ...puzzle().rowClues.map((c) => c.length)));

  // セルサイズ（グリッドサイズに応じて動的計算）
  const cellSize = createMemo(() => {
    const size = puzzle().size;
    if (size <= 5) return 48;
    if (size <= 10) return 36;
    if (size <= 15) return 28;
    return 22;
  });

  // パズルをロードして再生開始
  function loadPuzzle(newPuzzle: Puzzle): void {
    const result = solve(newPuzzle);

    // solve に失敗したパズル（矛盾・未求解）はスキップして次へ
    if (!result.ok || result.steps.length === 0) {
      loadPuzzle(nextPuzzle());
      return;
    }

    // puzzle / steps を同一バッチで更新し、サイズ不一致による参照エラーを防ぐ
    batch(() => {
      setIsCompleted(false);
      setCurrentStepIndex(0);
      setPuzzle(newPuzzle);
      setSteps(result.steps);
    });
  }

  // 再生ループ: 未完了のとき STEP_INTERVAL_MS ごとに1ステップ進める
  // currentStepIndex() を読むことで依存関係に加え、1ステップ進むたびに再実行させる
  createEffect(() => {
    if (isCompleted()) return;
    const idx = currentStepIndex();

    const id = setTimeout(() => {
      const nextIdx = idx + 1;
      setCurrentStepIndex(nextIdx);

      if (nextIdx >= steps().length) {
        setIsCompleted(true);
      }
    }, speed());

    onCleanup(() => clearTimeout(id));
  });

  // 完成後5秒で次のパズルへ自動遷移
  createEffect(() => {
    if (!isCompleted()) return;

    const id = setTimeout(() => loadPuzzle(nextPuzzle()), 5000);
    onCleanup(() => clearTimeout(id));
  });

  // 初回ロード
  onMount(() => loadPuzzle(ALL_PUZZLES[puzzleIndex]));

  return (
    <div class="app">
      <main class="main">
        {/* 2×2グリッド: [コーナー][列ヒント] / [行ヒント][グリッド] */}
        <div
          class="puzzle-container"
          style={{
            '--max-col-clues': maxColClues(),
            '--max-row-clues': maxRowClues(),
            '--cell-size': `${cellSize()}px`,
          }}
        >
          <div />
          {/* 左上コーナー（空白） */}
          <CluePanel
            clues={puzzle().colClues}
            direction="col"
            highlightIndex={highlightCol()}
            confirmedClues={confirmedColClues()}
            cellSize={cellSize()}
          />
          <CluePanel
            clues={puzzle().rowClues}
            direction="row"
            highlightIndex={highlightRow()}
            confirmedClues={confirmedRowClues()}
            cellSize={cellSize()}
          />
          <PuzzleGrid
            grid={displayGrid()}
            size={puzzle().size}
            cellSize={cellSize()}
            lastStep={currentStep()}
            isCompleted={isCompleted()}
          />
          {!isCompleted() && highlightRow() !== null && (
            <div
              class="highlight-overlay highlight-overlay--row"
              style={{ '--idx': `${highlightRow() ?? 0}` } as Record<string, string>}
            />
          )}
          {!isCompleted() && highlightCol() !== null && (
            <div
              class="highlight-overlay highlight-overlay--col"
              style={{ '--idx': `${highlightCol() ?? 0}` } as Record<string, string>}
            />
          )}
        </div>

        <div class="speed-control">
          <For each={SPEED_OPTIONS}>
            {(opt) => (
              <button
                class={`speed-btn${speed() === opt.ms ? ' speed-btn--active' : ''}`}
                onClick={() => setSpeed(opt.ms)}
              >
                {opt.label}
              </button>
            )}
          </For>
        </div>
      </main>
    </div>
  );
};

export default App;
