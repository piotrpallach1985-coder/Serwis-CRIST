import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Strażnik kodowania: wykrywa pliki źródłowe uszkodzone przez zapis w ANSI
// (np. PowerShell 5.1 Get-Content/Set-Content), które w UI dają znak zastępczy zamiast polskich znaków.
const SRC = path.resolve(__dirname, '../..');

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p);
    return /\.(jsx?|json)$/.test(e.name) ? [p] : [];
  });

describe('Kodowanie plików źródłowych', () => {
  it('żaden plik w src/ nie zawiera znaku zastępczego U+FFFD', () => {
    const broken = walk(SRC)
      .filter((f) => fs.readFileSync(f, 'utf8').includes('\uFFFD'))
      .map((f) => path.relative(SRC, f));
    expect(broken).toEqual([]);
  });
});
