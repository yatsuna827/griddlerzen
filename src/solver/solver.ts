import { assumeCell, pickUndecidedCell } from './backtracker.ts';
import { isLineContradicted } from './lineAnalyzer.ts';
import { analyzeLinePhase1and2 } from './lineAnalyzer.ts';
import type { GridState, Puzzle, SolveResult, Step } from './types.ts';

/**
 * 初期グリッドを生成する（全セル未確定）。
 */
function createEmptyGrid(size: number): GridState {
  return Array.from({ length: size }, () => Array.from({ length: size }, (): null => null));
}

/**
 * グリッドが全て確定済みか確認する。
 */
function isGridComplete(grid: GridState): boolean {
  return grid.every((row) => row.every((cell) => cell !== null));
}

/**
 * グリッド全体で矛盾が生じていないか確認する。
 */
function detectContradiction(grid: GridState, puzzle: Puzzle): boolean {
  const { size, rowClues, colClues } = puzzle;
  for (let r = 0; r < size; r++) {
    if (isLineContradicted(rowClues[r], grid[r])) return true;
  }
  for (let c = 0; c < size; c++) {
    if (
      isLineContradicted(
        colClues[c],
        grid.map((row) => row[c]),
      )
    )
      return true;
  }
  return false;
}

/**
 * フェーズ1〜3のループ（行・列解析を交互に繰り返し、収束するまで続ける）。
 * 新規確定がなくなったら 'stuck'、矛盾が発生したら 'contradiction'、完了なら 'done'。
 */
function runLineSolverLoop(grid: GridState, puzzle: Puzzle, steps: Step[]): 'done' | 'stuck' | 'contradiction' {
  const { size, rowClues, colClues } = puzzle;

  let changed = true;
  while (changed) {
    changed = false;

    // 行方向の解析
    for (let r = 0; r < size; r++) {
      const result = analyzeLinePhase1and2(rowClues[r], grid[r]);
      for (let c = 0; c < size; c++) {
        if (result.filled[c]) {
          grid[r][c] = 1;
          steps.push({ row: r, col: c, value: 1, phase: 1, sourceAxis: 'row', sourceIndex: r });
          changed = true;
        } else if (result.empty[c]) {
          grid[r][c] = 0;
          steps.push({ row: r, col: c, value: 0, phase: 2, sourceAxis: 'row', sourceIndex: r });
          changed = true;
        }
      }
    }

    // 列方向の解析
    for (let c = 0; c < size; c++) {
      const col = grid.map((row) => row[c]);
      const result = analyzeLinePhase1and2(colClues[c], col);
      for (let r = 0; r < size; r++) {
        if (result.filled[r]) {
          grid[r][c] = 1;
          steps.push({ row: r, col: c, value: 1, phase: 3, sourceAxis: 'col', sourceIndex: c });
          changed = true;
        } else if (result.empty[r]) {
          grid[r][c] = 0;
          steps.push({ row: r, col: c, value: 0, phase: 3, sourceAxis: 'col', sourceIndex: c });
          changed = true;
        }
      }
    }

    // 各イテレーション後に全行・列の矛盾チェック
    if (detectContradiction(grid, puzzle)) return 'contradiction';

    if (isGridComplete(grid)) return 'done';
  }

  return isGridComplete(grid) ? 'done' : 'stuck';
}

/**
 * 再帰的なソルバー。フェーズ1〜3で行き詰まったらフェーズ4（バックトラック）を適用する。
 */
function solveRecursive(grid: GridState, puzzle: Puzzle, steps: Step[]): SolveResult {
  const result = runLineSolverLoop(grid, puzzle, steps);

  if (result === 'done') return { ok: true, steps };
  if (result === 'contradiction') return { ok: false, reason: 'contradiction' };

  // フェーズ4: バックトラック
  const cell = pickUndecidedCell(grid);
  if (cell === null) return { ok: false, reason: 'unsolvable' };

  const { row, col } = cell;

  for (const value of [1, 0] as const) {
    const trialGrid = assumeCell(grid, row, col, value);
    const trialSteps: Step[] = [];

    const trialResult = solveRecursive(trialGrid, puzzle, trialSteps);

    if (trialResult.ok) {
      // 仮定ステップを記録してから残りのステップを追加
      steps.push({ row, col, value, phase: 4, sourceAxis: 'row', sourceIndex: row });
      for (const s of trialSteps) steps.push(s);
      return { ok: true, steps };
    }
  }

  return { ok: false, reason: 'contradiction' };
}

/**
 * メインソルバー。パズルを受け取り、全ステップを事前計算して返す。
 */
export function solve(puzzle: Puzzle): SolveResult {
  const grid = createEmptyGrid(puzzle.size);
  const steps: Step[] = [];
  return solveRecursive(grid, puzzle, steps);
}

/**
 * ステップを適用してグリッドを再構築する（検証・表示用）。
 */
export function applySteps(size: number, steps: Step[]): GridState {
  const grid = createEmptyGrid(size);
  for (const step of steps) {
    grid[step.row][step.col] = step.value;
  }
  return grid;
}
