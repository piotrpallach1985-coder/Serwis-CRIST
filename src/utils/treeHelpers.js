export const buildTree = (all, parentId = null, depth = 0) => {
  if (!all || !Array.isArray(all)) return [];
  const children = all.filter(m => parentId ? m.parentId === parentId : (!m.parentId || m.parentId === ''));
  return children.flatMap(m => [
    { ...m, depth, treeName: '\u00A0\u00A0'.repeat(depth) + (depth > 0 ? '↳ ' : '') + m.name },
    ...buildTree(all, m.id, depth + 1)
  ]);
};
