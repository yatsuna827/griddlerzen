import { describe, expect, test } from 'vitest';
import {
  analyzeLinePhase1and2,
  findEmptyCells,
  findFilledCells,
  getConfirmedClueIndices,
  isLineContradicted,
  leftmostPlacement,
  rightmostPlacement,
} from './lineAnalyzer.ts';
import type { CellValue } from './types.ts';

// ヘルパー: 文字列からラインを生成 ('.' = null, '1' = 1, '0' = 0)
function parseLine(s: string): CellValue[] {
  return s.split('').map((c) => (c === '.' ? null : c === '1' ? 1 : 0));
}

describe('leftmostPlacement', () => {
  test('空ライン + [3] → [0]', () => {
    expect(leftmostPlacement([3], parseLine('.....'))).toEqual([0]);
  });

  test('空ライン + [2,2] (5マス) → [0, 3]', () => {
    expect(leftmostPlacement([2, 2], parseLine('.....'))).toEqual([0, 3]);
  });

  test('空ライン + [1,1,1] (5マス) → [0, 2, 4]', () => {
    expect(leftmostPlacement([1, 1, 1], parseLine('.....'))).toEqual([0, 2, 4]);
  });

  test('ヒントがライン長ぴったり [5] (5マス) → [0]', () => {
    expect(leftmostPlacement([5], parseLine('.....'))).toEqual([0]);
  });

  test('ヒント空 [] → []', () => {
    expect(leftmostPlacement([], parseLine('.....'))).toEqual([]);
  });

  test('既確定空白セルを考慮した配置（先頭が0）', () => {
    const line = parseLine('0....');
    const result = leftmostPlacement([3], line);
    expect(result).not.toBeNull();
    expect(result![0]).toBeGreaterThanOrEqual(1);
  });

  test('既確定塗りセルを含む配置（index 2 が塗り）', () => {
    const line = parseLine('..1..');
    const result = leftmostPlacement([3], line);
    expect(result).not.toBeNull();
    const start = result![0];
    // ブロック [start, start+3) が index 2 を含む
    expect(start).toBeLessThanOrEqual(2);
    expect(start + 3).toBeGreaterThan(2);
  });

  test('ライン末尾の塗り確定セルをカバーするよう配置を調整', () => {
    // '....1' + [3] → 左詰めでも末尾の1をカバー必要 → [2]
    const line = parseLine('....1');
    expect(leftmostPlacement([3], line)).toEqual([2]);
  });

  test('矛盾する制約（ヒントが収まらない） → null', () => {
    expect(leftmostPlacement([6], parseLine('.....'))).toBeNull();
  });

  test('矛盾する制約（空白確定セルがブロックを分断） → null', () => {
    const line = parseLine('11011') as CellValue[];
    expect(leftmostPlacement([5], line)).toBeNull();
  });

  test('ヒントなしで塗り確定セルがある → null', () => {
    const line: CellValue[] = [null, 1, null];
    expect(leftmostPlacement([], line)).toBeNull();
  });

  test('10マス + [3,2] の左詰め → [0, 4]', () => {
    expect(leftmostPlacement([3, 2], parseLine('..........'))).toEqual([0, 4]);
  });
});

describe('rightmostPlacement', () => {
  test('空ライン + [3] (5マス) → [2]', () => {
    expect(rightmostPlacement([3], parseLine('.....'))).toEqual([2]);
  });

  test('空ライン + [2,2] (5マス) → [0, 3]（唯一配置）', () => {
    // [2,2] は5マスで唯一配置
    expect(rightmostPlacement([2, 2], parseLine('.....'))).toEqual([0, 3]);
  });

  test('矛盾する場合 → null', () => {
    expect(rightmostPlacement([6], parseLine('.....'))).toBeNull();
  });

  test('10マス + [3,2] の右詰め → [4, 8]', () => {
    // 右詰め: [3]→[4,7), [2]→[8,10) → starts=[4,8]
    expect(rightmostPlacement([3, 2], parseLine('..........'))).toEqual([4, 8]);
  });
});

describe('findFilledCells', () => {
  test('5マス [3] → 中央1マス (index 2) が確定塗り', () => {
    // 左詰:[0,3), 右詰:[2,5) → overlap: [2,3) = [2]
    expect(findFilledCells([3], parseLine('.....'))).toEqual([2]);
  });

  test('5マス [5] → 全マス確定塗り', () => {
    expect(findFilledCells([5], parseLine('.....'))).toEqual([0, 1, 2, 3, 4]);
  });

  test('5マス [1] → 確定塗りなし（オーバーラップなし）', () => {
    expect(findFilledCells([1], parseLine('.....'))).toEqual([]);
  });

  test('5マス [2,2] → index 0,1,3,4 が確定塗り', () => {
    expect(findFilledCells([2, 2], parseLine('.....'))).toEqual([0, 1, 3, 4]);
  });

  test('ヒント [] → 確定塗りなし', () => {
    expect(findFilledCells([], parseLine('.....'))).toEqual([]);
  });

  test('10マス [8] → index 2〜7 が確定塗り（左:0, 右:2, overlap:[2,8)）', () => {
    // 左詰:[0,8), 右詰:[2,10) → overlap:[2,8)
    expect(findFilledCells([8], parseLine('..........'))).toEqual([2, 3, 4, 5, 6, 7]);
  });

  test('10マス [5,2] → ブロックのオーバーラップ部分', () => {
    // 左詰: ブロック0=[0,5), ブロック1=[6,8)
    // 右詰: ブロック0=[2,7), ブロック1=[8,10)
    // ブロック0 overlap: [right=2, left+b=5) = {2,3,4}
    // ブロック1 overlap: [right=8, left+b=8) = {} (なし)
    const filled = findFilledCells([5, 2], parseLine('..........'));
    expect(filled).toEqual([2, 3, 4]);
  });
});

describe('findEmptyCells', () => {
  test('5マス [3] → 確定空白なし（全セルが塗りになりえる）', () => {
    // [3]の場合 left=0,right=2 → couldBeFilled=[0,5) → 全セル可能
    expect(findEmptyCells([3], parseLine('.....'))).toEqual([]);
  });

  test('5マス [2] → 確定空白なし（ブロックが index 1〜2 にも置ける）', () => {
    // left=0, right=3, couldBeFilled=[0, 3+2)=[0,5) → 全セル可能性あり
    expect(findEmptyCells([2], parseLine('.....'))).toEqual([]);
  });

  test('5マス [2,2] → 中央 index 2 のみ確定空白', () => {
    expect(findEmptyCells([2, 2], parseLine('.....'))).toEqual([2]);
  });

  test('ヒント [] → 全未確定セルが確定空白', () => {
    expect(findEmptyCells([], parseLine('.....'))).toEqual([0, 1, 2, 3, 4]);
  });

  test('ヒント [] で塗り確定セルがある → 矛盾のため []', () => {
    const line: CellValue[] = [null, 1, null];
    expect(findEmptyCells([], line)).toEqual([]);
  });

  test('10マス [1] → 全セルが塗りになりえる → 確定空白なし', () => {
    // left=0, right=9, couldBeFilled=[0,10) → 全セル可能
    expect(findEmptyCells([1], parseLine('..........'))).toEqual([]);
  });

  test('既確定の 0 セルは返さない', () => {
    const line: CellValue[] = [0, null, null, null, null];
    // ヒントなし → 全null セルが確定空白 → [1,2,3,4]
    const empty = findEmptyCells([], line);
    expect(empty).not.toContain(0); // already 0, not null
    expect(empty).toContain(1);
    expect(empty).toContain(2);
  });
});

describe('analyzeLinePhase1and2', () => {
  test('5マス [3] → index 2 のみ filled=true', () => {
    const result = analyzeLinePhase1and2([3], parseLine('.....'));
    expect(result.filled[2]).toBe(true);
    expect(result.filled[0]).toBe(false);
    expect(result.filled[4]).toBe(false);
    expect(result.empty.every((v) => !v)).toBe(true);
  });

  test('5マス [5] → 全 filled', () => {
    const result = analyzeLinePhase1and2([5], parseLine('.....'));
    expect(result.filled.every((v) => v)).toBe(true);
  });

  test('5マス [2,2] → index 0,1,3,4 が filled、index 2 が empty', () => {
    const result = analyzeLinePhase1and2([2, 2], parseLine('.....'));
    expect(result.empty[2]).toBe(true);
    expect(result.filled[0]).toBe(true);
    expect(result.filled[1]).toBe(true);
    expect(result.filled[3]).toBe(true);
    expect(result.filled[4]).toBe(true);
  });

  test('ヒント [] → 全 empty', () => {
    const result = analyzeLinePhase1and2([], parseLine('.....'));
    expect(result.empty.every((v) => v)).toBe(true);
    expect(result.filled.every((v) => !v)).toBe(true);
  });

  test('既確定セルは filled/empty に含まれない（再確定しない）', () => {
    const line: CellValue[] = [1, null, null, null, null];
    const result = analyzeLinePhase1and2([3], line);
    // index 0 は既に 1 なので filled[0] = false
    expect(result.filled[0]).toBe(false);
  });
});

describe('isLineContradicted', () => {
  test('正常なライン → false', () => {
    expect(isLineContradicted([3], parseLine('.....'))).toBe(false);
  });

  test('ヒントが収まらない → true', () => {
    expect(isLineContradicted([6], parseLine('.....'))).toBe(true);
  });

  test('空白確定がブロックを分断 → true', () => {
    const line: CellValue[] = [1, 1, 0, 1, 1];
    expect(isLineContradicted([5], line)).toBe(true);
  });

  test('ヒントなしで塗り確定セルがある → true', () => {
    const line: CellValue[] = [null, 1, null];
    expect(isLineContradicted([], line)).toBe(true);
  });

  test('ヒントなしで全空白確定 → false', () => {
    const line: CellValue[] = [0, 0, 0, 0, 0];
    expect(isLineContradicted([], line)).toBe(false);
  });

  test('末尾の塗り確定セルが右詰め配置でカバーできる → false', () => {
    // [null,null,null,null,1] + [2] → 右詰めで [3,5) → カバー可能
    const line: CellValue[] = [null, null, null, null, 1];
    expect(isLineContradicted([2], line)).toBe(false);
  });
});

describe('getConfirmedClueIndices', () => {
  test('全セル null → 全て未確定', () => {
    const line: CellValue[] = [null, null, null, null, null];
    expect(getConfirmedClueIndices([3], line)).toEqual([false]);
  });

  test('クルー [3]: 中央3セルが 1 確定・両端が 0 → 確定', () => {
    const line: CellValue[] = [0, 1, 1, 1, 0];
    expect(getConfirmedClueIndices([3], line)).toEqual([true]);
  });

  test('クルー [3]: 左端から3セルが 1・右隣が 0 → 確定', () => {
    const line: CellValue[] = [1, 1, 1, 0, null];
    expect(getConfirmedClueIndices([3], line)).toEqual([true]);
  });

  test('クルー [3]: ブロック内に null が混在 → 未確定', () => {
    const line: CellValue[] = [0, 1, null, 1, 0];
    expect(getConfirmedClueIndices([3], line)).toEqual([false]);
  });

  test('クルー [3]: 右端の境界が 0 未確定（null）→ 未確定', () => {
    // 右詰めと左詰めが一致していても右側が null なら境界不明
    const line: CellValue[] = [1, 1, 1, null, null];
    expect(getConfirmedClueIndices([3], line)).toEqual([false]);
  });

  test('クルー [2, 2]: 両ブロックとも確定 → [true, true]', () => {
    // [1,1,0,1,1,0,null] でも 0 境界があれば確定
    const line: CellValue[] = [1, 1, 0, 1, 1, 0, null];
    expect(getConfirmedClueIndices([2, 2], line)).toEqual([true, true]);
  });

  test('クルー [2, 2]: 左ブロックのみ確定', () => {
    const line: CellValue[] = [1, 1, 0, null, null, null, null];
    expect(getConfirmedClueIndices([2, 2], line)).toEqual([true, false]);
  });

  test('クルー [2, 2]: 右ブロックのみ確定', () => {
    const line: CellValue[] = [null, null, null, null, 0, 1, 1];
    expect(getConfirmedClueIndices([2, 2], line)).toEqual([false, true]);
  });

  test('クルー [2, 3]: 配置が一意でない → 未確定', () => {
    // 7マス [2,3]: 左詰め [0,3], 右詰め [0,4] → 第2ブロックは不一意
    const line: CellValue[] = [null, null, null, null, null, null, null];
    expect(getConfirmedClueIndices([2, 3], line)).toEqual([false, false]);
  });

  test('クルー [5]: 5マス全て 1 → 確定', () => {
    const line: CellValue[] = [1, 1, 1, 1, 1];
    expect(getConfirmedClueIndices([5], line)).toEqual([true]);
  });

  test('クルー []: 全セルが0確定 → [true]', () => {
    const line: CellValue[] = [0, 0, 0];
    expect(getConfirmedClueIndices([], line)).toEqual([true]);
  });

  test('クルー []: 未確定セルあり → [false]', () => {
    const line: CellValue[] = [null, null, null];
    expect(getConfirmedClueIndices([], line)).toEqual([false]);
  });

  test('矛盾ライン → 全て false', () => {
    const line: CellValue[] = [1, 1, 1, 1, 1]; // [2] に対して全塗り
    expect(getConfirmedClueIndices([2], line)).toEqual([false]);
  });
});
