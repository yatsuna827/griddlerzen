import type { Puzzle } from '../solver/types.ts';

const modules = import.meta.glob<Puzzle>('./[0-9]*.json', { eager: true, import: 'default' });
export const PUZZLES: Puzzle[] = Object.values(modules);
