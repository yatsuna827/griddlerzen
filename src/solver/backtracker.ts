import type { CellValue, GridState } from './types.ts';

/**
 * グリッドをディープコピーする。
 */
export function cloneGrid(grid: GridState): GridState {
  return grid.map((row) => [...row]);
}

/**
 * 未確定セルを1つ選ぶ。
 * 単純に左上から最初の null セルを返す。
 */
export function pickUndecidedCell(grid: GridState): { row: number; col: number } | null {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === null) return { row: r, col: c };
    }
  }
  return null;
}

/**
 * 指定セルに value を仮定したグリッドのコピーを返す。
 */
export function assumeCell(grid: GridState, row: number, col: number, value: CellValue): GridState {
  const newGrid = cloneGrid(grid);
  newGrid[row][col] = value;
  return newGrid;
}
