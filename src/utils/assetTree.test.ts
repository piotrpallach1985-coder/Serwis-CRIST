import { describe, it, expect } from 'vitest';
import { getDirectChildren, getParentMachine, getMachineHierarchy, buildAssetTree } from './assetTree';

describe('assetTree utils', () => {
  const machines = [
    { id: '1', name: 'Root Machine A', parentId: null },
    { id: '2', name: 'Child A1', parentId: '1' },
    { id: '3', name: 'Child A2', parentId: '1' },
    { id: '4', name: 'Grandchild A1-1', parentId: '2' },
    { id: '5', name: 'Root Machine B', parentId: null },
    { id: '6', name: 'Cyclic A', parentId: '7' },
    { id: '7', name: 'Cyclic B', parentId: '6' }, // Cyclic dependency
  ];

  describe('getDirectChildren', () => {
    it('should return direct children of a machine', () => {
      const children = getDirectChildren(machines, '1');
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toEqual(['2', '3']);
    });

    it('should return empty array if no children', () => {
      expect(getDirectChildren(machines, '4')).toEqual([]);
    });
  });

  describe('getParentMachine', () => {
    it('should return the parent machine', () => {
      const parent = getParentMachine(machines, machines[1]); // Child A1
      expect(parent).toBeDefined();
      expect(parent?.id).toBe('1');
    });

    it('should return null for root machines', () => {
      expect(getParentMachine(machines, machines[0])).toBeNull();
    });
  });

  describe('getMachineHierarchy', () => {
    it('should return breadcrumbs from root to current', () => {
      const hierarchy = getMachineHierarchy(machines, '4');
      expect(hierarchy.map(m => m.id)).toEqual(['1', '2', '4']);
    });

    it('should handle missing parent gracefully', () => {
      const hierarchy = getMachineHierarchy(machines, '5');
      expect(hierarchy.map(m => m.id)).toEqual(['5']);
    });

    it('should break cyclic dependencies safely', () => {
      const hierarchy = getMachineHierarchy(machines, '6');
      // 6 -> 7 -> 6... should stop at 7
      expect(hierarchy.map(m => m.id)).toEqual(['7', '6']);
    });
  });

  describe('buildAssetTree', () => {
    it('should build a nested tree structure', () => {
      const tree = buildAssetTree(machines);
      expect(tree).toHaveLength(2); // Only true roots // Root A, Root B, Cyclic A (acts as root if parent missing from tree root context), wait actually Cyclic B might not act as root depending on order.
      
      const rootA = tree.find(n => n.id === '1');
      expect(rootA).toBeDefined();
      expect(rootA?.children).toHaveLength(2);
      
      const childA1 = rootA?.children.find(n => n.id === '2');
      expect(childA1?.children).toHaveLength(1);
      expect(childA1?.children[0].id).toBe('4');
    });

    it('should return empty array for empty input', () => {
      expect(buildAssetTree([])).toEqual([]);
    });
  });
});
