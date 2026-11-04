export const getMachineDescendantIds = (all, rootId) => {
  const descendants = new Set();
  if (!all || !Array.isArray(all) || !rootId) return descendants;
  const queue = [rootId];
  const visited = new Set([rootId]);

  while (queue.length > 0) {
    const currentId = queue.shift();
    for (const item of all) {
      if (item && item.parentId === currentId && item.id && !visited.has(item.id)) {
        visited.add(item.id);
        descendants.add(item.id);
        queue.push(item.id);
      }
    }
  }
  return descendants;
};

export const buildTree = (all, parentId = null, depth = 0, visited = new Set()) => {
  if (!all || !Array.isArray(all) || depth > 50) return [];
  const children = all.filter(m =>
    parentId ? m.parentId === parentId : !m.parentId || m.parentId === ''
  );
  const result = [];
  for (const m of children) {
    if (!m || (m.id && visited.has(m.id))) continue;
    const nextVisited = new Set(visited);
    if (m.id) nextVisited.add(m.id);
    result.push({
      ...m,
      depth,
      treeName: '\u00A0\u00A0'.repeat(depth) + (depth > 0 ? '↳ ' : '') + m.name,
    });
    if (m.id) {
      result.push(...buildTree(all, m.id, depth + 1, nextVisited));
    }
  }
  return result;
};
