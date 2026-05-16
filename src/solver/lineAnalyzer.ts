import type { CellValue, LineSolution } from './types.ts';

/**
 * ヒントブロックの左詰め配置を計算する。
 * 戻り値は各ブロックの開始インデックスの配列。矛盾する場合は null。
 *
 * 「左詰め」= 全ての確定セル制約を満たしつつ、各ブロックをできるだけ左に配置した状態。
 */
export function leftmostPlacement(clues: number[], line: CellValue[]): number[] | null {
  const n = line.length;
  const k = clues.length;

  if (k === 0) {
    // ヒントなし: 塗り確定セルがあれば矛盾
    for (let j = 0; j < n; j++) {
      if (line[j] === 1) return null;
    }
    return [];
  }

  const positions: number[] = [];
  let start = 0; // 現在のブロックの最小開始位置

  for (let i = 0; i < k; i++) {
    const b = clues[i];
    const isLastBlock = i === k - 1;
    let pos = start;
    let placed = false;

    while (pos + b <= n) {
      // pos を start より前進させた場合、スキップした位置に塗り確定セルがあれば矛盾
      if (pos > start && line[pos - 1] === 1) return null;

      // ブロック [pos, pos+b) を配置できるか確認
      let skipTo = -1;
      for (let j = pos; j < pos + b; j++) {
        if (line[j] === 0) {
          skipTo = j + 1;
          break;
        }
      }

      if (skipTo >= 0) {
        // ブロック内に空白確定セルがある → スキップ先まで移動
        // スキップ途中の塗り確定セルは覆えない → 矛盾
        for (let j = pos; j < skipTo - 1; j++) {
          if (line[j] === 1) return null;
        }
        pos = skipTo;
        continue;
      }

      // ブロックが配置可能。セパレータ確認（直後が塗り確定なら進める）
      if (pos + b < n && line[pos + b] === 1) {
        pos++;
        continue;
      }

      // 最後のブロックの場合、残りのラインに塗り確定セルがないか確認
      if (isLastBlock) {
        let trailingOne = false;
        for (let j = pos + b; j < n; j++) {
          if (line[j] === 1) {
            trailingOne = true;
            break;
          }
        }
        if (trailingOne) {
          pos++;
          continue;
        }
      }

      // ここに配置確定
      positions.push(pos);
      start = pos + b + 1;
      placed = true;
      break;
    }

    if (!placed) return null;
  }

  return positions;
}

/**
 * ヒントブロックの右詰め配置を計算する。
 * 戻り値は各ブロックの開始インデックスの配列。矛盾する場合は null。
 */
export function rightmostPlacement(clues: number[], line: CellValue[]): number[] | null {
  const n = line.length;
  const reversed = clues.toReversed();
  const reversedLine = (line as CellValue[]).toReversed();

  const reversedPositions = leftmostPlacement(reversed, reversedLine);
  if (reversedPositions === null) return null;

  // 反転座標を元に戻して逆順に並べ替え
  const positions = reversedPositions.map((pos, i) => n - pos - reversed[i]).toReversed();
  return positions;
}

/**
 * フェーズ1: 確定塗りセルのインデックス集合を返す。
 * 左詰め・右詰め配置で両方とも塗りになるセル（オーバーラップ部分）。
 */
export function findFilledCells(clues: number[], line: CellValue[]): number[] {
  if (clues.length === 0) return [];

  const left = leftmostPlacement(clues, line);
  const right = rightmostPlacement(clues, line);
  if (left === null || right === null) return [];

  const filled: number[] = [];
  for (let i = 0; i < clues.length; i++) {
    // ブロック i のオーバーラップ: [right[i], left[i]+clues[i])
    for (let pos = right[i]; pos < left[i] + clues[i]; pos++) {
      filled.push(pos);
    }
  }
  return [...new Set(filled)].toSorted((a, b) => a - b);
}

/**
 * フェーズ2: 確定空白セルのインデックス集合を返す。
 * 「塗りになり得る範囲」= 左詰め開始 〜 右詰め終了 の外側にある未確定セル。
 */
export function findEmptyCells(clues: number[], line: CellValue[]): number[] {
  const n = line.length;

  const left = leftmostPlacement(clues, line);
  if (left === null) return []; // 矛盾ライン

  if (clues.length === 0) {
    // ヒントなし → 全未確定セルが確定空白
    return Array.from({ length: n }, (_, i) => i).filter((i) => line[i] === null);
  }

  const right = rightmostPlacement(clues, line);
  if (right === null) return [];

  // ブロック i は left[i] 〜 right[i] の任意の位置に置き得る
  // → 塗りになりえるセルは [left[i], right[i] + clues[i]) の全セル
  const couldBeFilled = new Set<number>();
  for (let i = 0; i < clues.length; i++) {
    for (let pos = left[i]; pos < right[i] + clues[i]; pos++) {
      couldBeFilled.add(pos);
    }
  }

  const empty: number[] = [];
  for (let j = 0; j < n; j++) {
    if (!couldBeFilled.has(j) && line[j] === null) {
      empty.push(j);
    }
  }
  return empty;
}

/**
 * フェーズ1+2 をまとめて実行する。
 * 返す filled/empty は「新たに確定できるセル」のみ（既確定セルは含まない）。
 */
export function analyzeLinePhase1and2(clues: number[], line: CellValue[]): LineSolution {
  const len = line.length;
  const filled: boolean[] = Array.from({ length: len }, (): boolean => false);
  const empty: boolean[] = Array.from({ length: len }, (): boolean => false);

  for (const idx of findFilledCells(clues, line)) {
    if (line[idx] === null) filled[idx] = true;
  }

  for (const idx of findEmptyCells(clues, line)) {
    if (line[idx] === null) empty[idx] = true;
  }

  return { filled, empty };
}

/**
 * 矛盾検出: ヒントと現在のラインが矛盾しているか確認する。
 */
export function isLineContradicted(clues: number[], line: CellValue[]): boolean {
  return leftmostPlacement(clues, line) === null || rightmostPlacement(clues, line) === null;
}

/**
 * 各クルー番号が「確定済み」かを boolean[] で返す。
 *
 * 確定条件（全て満たすこと）:
 *   1. 左詰め・右詰み配置でクルー k の開始位置が一致している（配置が一意）
 *   2. その範囲 [start, start+clues[k]) のセルが全て 1
 *   3. 左端が境界（index=0）または 0 確定セル、右端が境界または 0 確定セル
 */
export function getConfirmedClueIndices(clues: number[], line: CellValue[]): boolean[] {
  if (clues.length === 0) return [];

  const left = leftmostPlacement(clues, line);
  const right = rightmostPlacement(clues, line);
  if (!left || !right) return Array.from({ length: clues.length }, (): boolean => false);

  const n = line.length;
  const result: boolean[] = Array.from({ length: clues.length }, (): boolean => false);

  for (let k = 0; k < clues.length; k++) {
    if (left[k] !== right[k]) continue; // 配置が一意でない

    const s: number = left[k];
    const e: number = s + clues[k];

    // ブロック内が全て 1 確定
    let allFilled = true;
    for (let i = s; i < e; i++) {
      if (line[i] !== 1) {
        allFilled = false;
        break;
      }
    }
    if (!allFilled) continue;

    // 両端が境界または 0 確定
    const leftBounded = s === 0 || line[s - 1] === 0;
    const rightBounded = e === n || line[e] === 0;
    if (!leftBounded || !rightBounded) continue;

    result[k] = true;
  }

  return result;
}
