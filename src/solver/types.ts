// 0=空白確定, 1=塗り確定, null=未確定
export type CellValue = 0 | 1 | null;

// グリッド全体の状態
export type GridState = CellValue[][];

// 1セルの確定ステップ
export type Step = {
  row: number;
  col: number;
  value: 1 | 0;
  phase: 1 | 2 | 3 | 4;
  sourceAxis: 'row' | 'col';
  sourceIndex: number;
};

// パズル定義
export type Puzzle = {
  size: number;
  rowClues: number[][];
  colClues: number[][];
  solution: (0 | 1)[][];
};

// ライン解析の結果
export type LineSolution = {
  filled: boolean[]; // 確定塗り位置
  empty: boolean[]; // 確定空白位置
};

// ソルバーの結果
export type SolveResult = { ok: true; steps: Step[] } | { ok: false; reason: 'contradiction' | 'unsolvable' };
