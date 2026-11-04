import { describe, it, expect } from 'vitest';
import { buildTree, getMachineDescendantIds } from '../treeHelpers';

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

    it('chroni przed cyklami (A -> B -> C -> B) i zwraca wszystkie identyfikatory potomków w getMachineDescendantIds', () => {
      const cyclic = [
        { id: 'root', name: 'Główna', parentId: '' },
        { id: 'child1', name: 'Podzespół 1', parentId: 'root' },
        { id: 'child2', name: 'Podzespół 2', parentId: 'child1' },
        { id: 'loop', name: 'Pętla', parentId: 'child2' },
      ];
      // Wprowadzamy cykl: child1 -> loop -> child1
      cyclic[1].parentId = 'loop';
      cyclic[3].parentId = 'root';

      expect(() => buildTree(cyclic)).not.toThrow();

      const descendants = getMachineDescendantIds(
        [
          { id: 'm1', name: 'Linia', parentId: '' },
          { id: 'm2', name: 'Stacja A', parentId: 'm1' },
          { id: 'm3', name: 'Silnik A1', parentId: 'm2' },
          { id: 'm4', name: 'Inna linia', parentId: '' },
        ],
        'm1'
      );
      expect(Array.from(descendants)).toEqual(['m2', 'm3']);
    });
  });
});
