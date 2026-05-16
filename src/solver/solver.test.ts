import { describe, expect, test } from 'vitest';
import { applySteps, solve } from './solver.ts';
import type { Puzzle } from './types.ts';

// ==============================
// テスト用パズル定義
// ==============================

// 5×5 全埋めパズル
const ALL_FILLED_5X5: Puzzle = {
  size: 5,
  rowClues: [[5], [5], [5], [5], [5]],
  colClues: [[5], [5], [5], [5], [5]],
  solution: [
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ],
};

// 5×5 全空白パズル
const ALL_EMPTY_5X5: Puzzle = {
  size: 5,
  rowClues: [[], [], [], [], []],
  colClues: [[], [], [], [], []],
  solution: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
};

// 5×5 十字形パズル（バックトラック不要）
// 解:
//   0 0 1 0 0
//   0 0 1 0 0
//   1 1 1 1 1
//   0 0 1 0 0
//   0 0 1 0 0
const CROSS_5X5: Puzzle = {
  size: 5,
  rowClues: [[1], [1], [5], [1], [1]],
  colClues: [[1], [1], [5], [1], [1]],
  solution: [
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
};

// 矛盾するパズル（行と列が整合しない）
// 行ヒント: 各行が全部空白
// 列ヒント: 各列が全部塗り
const CONTRADICTED_5X5: Puzzle = {
  size: 5,
  rowClues: [[], [], [], [], []],
  colClues: [[5], [5], [5], [5], [5]],
  solution: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
};

// バックトラックが必要な5×5パズル
// 解:
//   1 0 0 0 1
//   0 0 0 0 0
//   0 0 1 0 0
//   0 0 0 0 0
//   1 0 0 0 1
const CORNERS_5X5: Puzzle = {
  size: 5,
  rowClues: [[1, 1], [], [1], [], [1, 1]],
  colClues: [[1, 1], [], [1], [], [1, 1]],
  solution: [
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
  ],
};

function computeLineClues(line: (0 | 1)[]): number[] {
  const clues: number[] = [];
  let count = 0;
  for (const v of line) {
    if (v === 1) count++;
    else if (count > 0) {
      clues.push(count);
      count = 0;
    }
  }
  if (count > 0) clues.push(count);
  return clues;
}

// 10×10 格子状パズル（3×3ブロックが格子状に並ぶ）
// 解: 各行に [1,1,1] が2箇所, 各列に [1,1,1] が2箇所
// 行0-2: 1 1 1 0 1 1 1 0 1 1 ...
// 実際には単純な格子パターン
function makeGrid10x10(): Puzzle {
  // 2セルおきに3x3ブロックを配置: (0-2, 0-2), (0-2, 5-7), etc.
  const solution: (0 | 1)[][] = Array.from({ length: 10 }, (_, r) =>
    Array.from({ length: 10 }, (_, c) => {
      const inR = r < 3 || (r >= 5 && r < 8);
      const inC = c < 3 || (c >= 5 && c < 8);
      return inR && inC ? 1 : 0;
    }),
  );

  const rowClues = solution.map(computeLineClues);
  const colClues = Array.from({ length: 10 }, (_, c) => computeLineClues(solution.map((row) => row[c])));

  return { size: 10, rowClues, colClues, solution };
}

// ==============================
// テスト
// ==============================

describe('solve', () => {
  test('5×5 全埋めパズルを正解する', () => {
    const result = solve(ALL_FILLED_5X5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const grid = applySteps(5, result.steps);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        expect(grid[r][c]).toBe(ALL_FILLED_5X5.solution[r][c]);
      }
    }
  });

  test('5×5 全空白パズルを正解する', () => {
    const result = solve(ALL_EMPTY_5X5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const grid = applySteps(5, result.steps);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        expect(grid[r][c]).toBe(0);
      }
    }
  });

  test('5×5 十字形パズル（バックトラック不要）を正解する', () => {
    const result = solve(CROSS_5X5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const grid = applySteps(5, result.steps);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        expect(grid[r][c]).toBe(CROSS_5X5.solution[r][c]);
      }
    }
  });

  test('5×5 四隅パズル（バックトラックあり）を正解する', () => {
    const result = solve(CORNERS_5X5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const grid = applySteps(5, result.steps);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        expect(grid[r][c]).toBe(CORNERS_5X5.solution[r][c]);
      }
    }
  });

  test('10×10 格子状パズルを正解する', () => {
    const puzzle = makeGrid10x10();
    const result = solve(puzzle);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const grid = applySteps(10, result.steps);
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        expect(grid[r][c]).toBe(puzzle.solution[r][c]);
      }
    }
  });

  test('矛盾するパズルに contradiction を返す', () => {
    const result = solve(CONTRADICTED_5X5);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('contradiction');
  });

  test('全ステップが有効な座標・値・フェーズを持つ', () => {
    const result = solve(CROSS_5X5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const step of result.steps) {
      expect(step.row).toBeGreaterThanOrEqual(0);
      expect(step.row).toBeLessThan(5);
      expect(step.col).toBeGreaterThanOrEqual(0);
      expect(step.col).toBeLessThan(5);
      expect([0, 1]).toContain(step.value);
      expect([1, 2, 3, 4]).toContain(step.phase);
      expect(['row', 'col']).toContain(step.sourceAxis);
    }
  });

  test('ステップ適用後の全セルが確定済み（null なし）', () => {
    const result = solve(CROSS_5X5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const grid = applySteps(5, result.steps);
    for (const row of grid) {
      for (const cell of row) {
        expect(cell).not.toBeNull();
      }
    }
  });

  test('同一セルが複数回確定されない', () => {
    const result = solve(CROSS_5X5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const confirmed = new Set<string>();
    for (const step of result.steps) {
      const key = `${step.row},${step.col}`;
      expect(confirmed.has(key)).toBe(false);
      confirmed.add(key);
    }
  });

  test('全セルが確定される（総ステップ数 = サイズ²）', () => {
    const result = solve(ALL_FILLED_5X5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.steps.length).toBe(25);
  });
});
