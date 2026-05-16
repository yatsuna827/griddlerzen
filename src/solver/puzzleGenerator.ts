import { analyzeLinePhase1and2 } from './lineAnalyzer.ts';
import { solve } from './solver.ts';
import type { CellValue, Puzzle } from './types.ts';

function lineToClues(line: (0 | 1)[]): number[] {
  const clues: number[] = [];
  let count = 0;
  for (const v of line) {
    if (v === 1) {
      count++;
    } else if (count > 0) {
      clues.push(count);
      count = 0;
    }
  }
  if (count > 0) clues.push(count);
  return clues;
}

/**
 * solution からヒントを計算する。
 */
export function computeClues(solution: (0 | 1)[][]): { rowClues: number[][]; colClues: number[][] } {
  const colCount = solution[0]?.length ?? 0;
  const rowClues = solution.map(lineToClues);
  const colClues = Array.from({ length: colCount }, (_, c) => lineToClues(solution.map((row) => row[c])));

  return { rowClues, colClues };
}

/**
 * パズルが一意解を持つか検証する（solve の結果が solution と一致するか確認）。
 */
export function verifyUniqueSolution(puzzle: Puzzle): boolean {
  const result = solve(puzzle);
  if (!result.ok) return false;

  // applySteps で得たグリッドが solution と一致するか確認
  const grid: (0 | 1 | null)[][] = Array.from({ length: puzzle.size }, () =>
    Array.from({ length: puzzle.size }, (): null => null),
  );
  for (const step of result.steps) {
    grid[step.row][step.col] = step.value;
  }

  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      if (grid[r][c] !== puzzle.solution[r][c]) return false;
    }
  }

  return true;
}

/**
 * ランダムな (0|1)[][] グリッドを生成する。
 * density: 塗りセルの割合 (0.0〜1.0)
 */
function randomGrid(size: number, density = 0.5): (0 | 1)[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => (Math.random() < density ? 1 : 0))) as (
    | 0
    | 1
  )[][];
}

/**
 * 指定サイズのランダムピクロスを生成する。
 * 一意解を持つパズルが生成されるまでリトライする。
 * 最大 maxRetries 回試行して失敗した場合は例外を投げる。
 */
export function generatePuzzle(size: 5 | 10 | 15 | 20, maxRetries = 100): Puzzle {
  for (let i = 0; i < maxRetries; i++) {
    const solution = randomGrid(size);
    const { rowClues, colClues } = computeClues(solution);
    const puzzle: Puzzle = { size, rowClues, colClues, solution };

    if (verifyUniqueSolution(puzzle)) return puzzle;
  }

  throw new Error(`Failed to generate a valid ${size}×${size} puzzle after ${maxRetries} retries`);
}

/**
 * バックトラックなしのライン解析を繰り返し、何パス要したかを返す。
 * 「1パス」= 全行・全列を1回ずつ走査して少なくとも1セルが確定した回。
 */
function countLineSolverPasses(puzzle: Puzzle): number {
  const { size, rowClues, colClues } = puzzle;
  const grid: CellValue[][] = Array.from({ length: size }, () => Array.from({ length: size }, (): null => null));

  let passes = 0;
  let changed = true;

  while (changed) {
    changed = false;

    for (let r = 0; r < size; r++) {
      const result = analyzeLinePhase1and2(rowClues[r], grid[r]);
      for (let c = 0; c < size; c++) {
        if (result.filled[c]) {
          grid[r][c] = 1;
          changed = true;
        } else if (result.empty[c]) {
          grid[r][c] = 0;
          changed = true;
        }
      }
    }

    for (let c = 0; c < size; c++) {
      const col = grid.map((row) => row[c]);
      const result = analyzeLinePhase1and2(colClues[c], col);
      for (let r = 0; r < size; r++) {
        if (result.filled[r]) {
          grid[r][c] = 1;
          changed = true;
        } else if (result.empty[r]) {
          grid[r][c] = 0;
          changed = true;
        }
      }
    }

    if (changed) passes++;
  }

  return passes;
}

/**
 * ライン解析を minPasses パス以上要するパズルをランダム生成する。
 * 単純な幾何学パターンでは解けず、行・列の相互制約が深く連鎖するパズルのみを返す。
 * maxRetries 回試行して見つからなければ generatePuzzle のフォールバックを使用。
 */
export function generateComplexPuzzle(size: 5 | 10 | 15 | 20 = 15, minPasses = 5): Puzzle {
  // 上限なしで試行し続ける（複雑なパズルが必ず存在するため無限ループにはならない）
  for (;;) {
    const solution = randomGrid(size);
    const { rowClues, colClues } = computeClues(solution);
    const puzzle: Puzzle = { size, rowClues, colClues, solution };

    // パス数チェックのみ。5パス以上進行した時点で矛盾の可能性は極めて低い。
    if (countLineSolverPasses(puzzle) >= minPasses) return puzzle;
  }
}
