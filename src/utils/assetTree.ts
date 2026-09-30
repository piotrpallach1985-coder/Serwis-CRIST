export interface Machine {
  id: string;
  name: string;
  parentId?: string | null;
  [key: string]: any; // Allow other properties
}

export interface MachineTreeNode extends Machine {
  children: MachineTreeNode[];
}

/**
 * Zwraca bezpośrednie maszyny-dzieci dla podanej maszyny
 */
export function getDirectChildren(machines: Machine[], parentId: string): Machine[] {
  if (!machines || !parentId) return [];
  return machines.filter(m => m.parentId === parentId);
}

/**
 * Zwraca maszynę nadrzędną dla podanej maszyny
 */
export function getParentMachine(machines: Machine[], machine: Machine): Machine | null {
  if (!machines || !machine || !machine.parentId) return null;
  return machines.find(m => m.id === machine.parentId) || null;
}

/**
 * Buduje hierarchię ścieżki (breadcrumbs) od głównego rodzica do samej maszyny
 * Zwraca tablicę maszyn w kolejności: [Root, ..., Parent, Current]
 */
export function getMachineHierarchy(machines: Machine[], machineId: string): Machine[] {
  const hierarchy: Machine[] = [];
  let currentId: string | null = machineId;

  // Zapobiega nieskończonym pętlom w przypadku cyklicznych referencji
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const machine = machines.find(m => m.id === currentId);
    if (machine) {
      hierarchy.unshift(machine);
      currentId = machine.parentId || null;
    } else {
      currentId = null;
    }
  }

  return hierarchy;
}

/**
 * Buduje pełne, zagnieżdżone drzewo aktywów (wszystkie maszyny jako węzły)
 * Zwraca tylko maszyny, które nie mają rodzica (root nodes), z wypełnioną właściwością `children`
 */
export function buildAssetTree(machines: Machine[]): MachineTreeNode[] {
  if (!machines) return [];
  
  const machineMap = new Map<string, MachineTreeNode>();
  
  // Inicjalizacja mapy
  machines.forEach(m => {
    machineMap.set(m.id, { ...m, children: [] });
  });

  const roots: MachineTreeNode[] = [];

  // Budowa drzewa
  machines.forEach(m => {
    const node = machineMap.get(m.id);
    if (!node) return;

    if (m.parentId && machineMap.has(m.parentId)) {
      const parent = machineMap.get(m.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}
