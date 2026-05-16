/**
 * ピクロスパズルを生成して src/puzzles/ に追加するスクリプト。
 * 既存ファイルは上書きせず、連番で新規追加する。
 * 使い方: pnpm generate:puzzles
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { generateComplexPuzzle } from '../src/solver/puzzleGenerator.ts';
import { solve } from '../src/solver/solver.ts';
import type { Puzzle } from '../src/solver/types.ts';

const PUZZLES_DIR = new URL('../src/puzzles/', import.meta.url);

mkdirSync(PUZZLES_DIR, { recursive: true });

// 既存の連番 .json ファイルから次の ID を決定
const existing = readdirSync(PUZZLES_DIR).filter((f) => /^\d+\.json$/.test(f));
const maxId = existing.length === 0 ? 0 : Math.max(...existing.map((f) => parseInt(f, 10)));
let nextId = maxId + 1;

const CONFIGS: { size: 5 | 10 | 15 | 20; count: number; minPasses: number }[] = [
  { size: 10, count: 15, minPasses: 5 },
];

for (const { size, count, minPasses } of CONFIGS) {
  console.error(`Generating ${count} puzzles for ${size}×${size} (minPasses=${minPasses})...`);
  for (let i = 0; i < count; i++) {
    process.stderr.write(`  [${String(nextId).padStart(4, '0')}] `);
    let p: Puzzle;
    for (;;) {
      p = generateComplexPuzzle(size, minPasses);
      if (solve(p).ok) break;
      process.stderr.write('x');
    }
    writeFileSync(new URL(`${String(nextId).padStart(4, '0')}.json`, PUZZLES_DIR), JSON.stringify(p));
    process.stderr.write('done\n');
    nextId++;
  }
}

console.error('Done.');
