import { describe, it, expect } from 'vitest';
import { getDirectChildren, getParentMachine, getMachineHierarchy, buildAssetTree, Machine } from '../assetTree';

describe('Asset Tree Utilities', () => {
  const mockMachines: Machine[] = [
    { id: 'M1', name: 'Główna Linia Produkcyjna', parentId: null },
    { id: 'M2', name: 'Silnik Główny', parentId: 'M1' },
    { id: 'M3', name: 'Przekładnia', parentId: 'M2' },
    { id: 'M4', name: 'Pompa Chłodziwa', parentId: 'M1' },
    { id: 'M5', name: 'Niezależny Kompresor', parentId: null },
    
    // Cykliczne referencje dla testów bezpieczeństwa
    { id: 'C1', name: 'Cykl 1', parentId: 'C2' },
    { id: 'C2', name: 'Cykl 2', parentId: 'C1' },
  ];

  it('should correctly identify direct children', () => {
    const childrenOfM1 = getDirectChildren(mockMachines, 'M1');
    expect(childrenOfM1).toHaveLength(2);
    expect(childrenOfM1.map(c => c.id)).toContain('M2');
    expect(childrenOfM1.map(c => c.id)).toContain('M4');

    const childrenOfM5 = getDirectChildren(mockMachines, 'M5');
    expect(childrenOfM5).toHaveLength(0);
  });

  it('should correctly identify parent machine', () => {
    const parentOfM3 = getParentMachine(mockMachines, mockMachines.find(m => m.id === 'M3')!);
    expect(parentOfM3).not.toBeNull();
    expect(parentOfM3?.id).toBe('M2');

    const parentOfM1 = getParentMachine(mockMachines, mockMachines.find(m => m.id === 'M1')!);
    expect(parentOfM1).toBeNull();
  });

  it('should build correct hierarchy breadcrumbs (from root to target)', () => {
    const hierarchy = getMachineHierarchy(mockMachines, 'M3');
    expect(hierarchy).toHaveLength(3);
    expect(hierarchy[0].id).toBe('M1'); // Root
    expect(hierarchy[1].id).toBe('M2'); // Parent
    expect(hierarchy[2].id).toBe('M3'); // Target
  });

  it('should prevent infinite loops in hierarchy due to cyclic references', () => {
    const hierarchy = getMachineHierarchy(mockMachines, 'C1');
    // C1 -> C2 -> C1 (cycle detected and stopped)
    expect(hierarchy).toHaveLength(2);
    expect(hierarchy.map(h => h.id)).toEqual(expect.arrayContaining(['C1', 'C2']));
  });

  it('should build full nested asset tree', () => {
    const tree = buildAssetTree(mockMachines);
    
    // There are 3 root nodes (M1, M5, and C1/C2 cycle resolves arbitrarily depending on order, actually C1/C2 are not roots because they both have parents! So they won't appear in roots array)
    // Wait, roots are those where parentId doesn't exist in machineMap OR parentId is null
    
    const rootM1 = tree.find(node => node.id === 'M1');
    expect(rootM1).toBeDefined();
    expect(rootM1?.children).toHaveLength(2);
    
    const nodeM2 = rootM1?.children.find(c => c.id === 'M2');
    expect(nodeM2).toBeDefined();
    expect(nodeM2?.children).toHaveLength(1);
    expect(nodeM2?.children[0].id).toBe('M3');

    const rootM5 = tree.find(node => node.id === 'M5');
    expect(rootM5).toBeDefined();
    expect(rootM5?.children).toHaveLength(0);
  });
});
