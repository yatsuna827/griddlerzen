import { describe, expect, test } from 'vitest';
import { computeClues, verifyUniqueSolution } from './puzzleGenerator.ts';
import type { Puzzle } from './types.ts';

describe('computeClues', () => {
  test('全塗りの1行 → [size]', () => {
    const solution: (0 | 1)[][] = [[1, 1, 1, 1, 1]];
    const { rowClues } = computeClues(solution);
    expect(rowClues[0]).toEqual([5]);
  });

  test('全空白の1行 → []', () => {
    const solution: (0 | 1)[][] = [[0, 0, 0, 0, 0]];
    const { rowClues } = computeClues(solution);
    expect(rowClues[0]).toEqual([]);
  });

  test('交互パターン → [1,1,1]', () => {
    const solution: (0 | 1)[][] = [[1, 0, 1, 0, 1]];
    const { rowClues } = computeClues(solution);
    expect(rowClues[0]).toEqual([1, 1, 1]);
  });

  test('列ヒントも正しく計算される', () => {
    // 3×3 グリッド
    const solution: (0 | 1)[][] = [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ];
    const { rowClues, colClues } = computeClues(solution);
    expect(rowClues).toEqual([[1], [2], [2]]);
    expect(colClues).toEqual([[2], [2], [1]]);
  });

  test('5×5 十字形のヒントが正しい', () => {
    const solution: (0 | 1)[][] = [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ];
    const { rowClues, colClues } = computeClues(solution);
    expect(rowClues).toEqual([[1], [1], [5], [1], [1]]);
    expect(colClues).toEqual([[1], [1], [5], [1], [1]]);
  });
});

describe('verifyUniqueSolution', () => {
  test('正しいパズルは一意解を持つ', () => {
    const puzzle: Puzzle = {
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
    expect(verifyUniqueSolution(puzzle)).toBe(true);
  });

  test('矛盾するパズルは false を返す', () => {
    const puzzle: Puzzle = {
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
    expect(verifyUniqueSolution(puzzle)).toBe(false);
  });
});
