import { describe, it, expect } from 'vitest';
import { buildTree } from '../treeHelpers';

describe('treeHelpers', () => {
  describe('buildTree', () => {
    it('spłaszcza hierarchię maszyn z poprawnymi wcięciami i głębokościami', () => {
      const machines = [
        { id: '1', name: 'Główna Maszyna', parentId: null },
        { id: '2', name: 'Podzespół 1', parentId: '1' },
        { id: '3', name: 'Część Podzespołu 1', parentId: '2' },
        { id: '4', name: 'Inna Maszyna', parentId: '' },
      ];

      const result = buildTree(machines);

      expect(result).toHaveLength(4);
      expect(result.map(m => m.id)).toEqual(['1', '2', '3', '4']);

      expect(result[0].depth).toBe(0);
      expect(result[0].treeName).toBe('Główna Maszyna');

      expect(result[1].depth).toBe(1);
      expect(result[1].treeName).toBe('\u00A0\u00A0\u21B3 Podzespół 1');

      expect(result[2].depth).toBe(2);
      expect(result[2].treeName).toBe('\u00A0\u00A0\u00A0\u00A0\u21B3 Część Podzespołu 1');

      expect(result[3].depth).toBe(0);
      expect(result[3].treeName).toBe('Inna Maszyna');
    });

    it('nie gubi oryginalnej nazwy (używanej do wyszukiwania po nazwie)', () => {
      const result = buildTree([
        { id: 'a', name: 'Prasa', parentId: null },
        { id: 'b', name: 'Pompa', parentId: 'a' },
      ]);
      expect(result[1].name).toBe('Pompa');
    });

    it('zwraca pustą tablicę dla null/undefined/pustej listy', () => {
      expect(buildTree(null)).toEqual([]);
      expect(buildTree(undefined)).toEqual([]);
      expect(buildTree([])).toEqual([]);
    });
  });
});
