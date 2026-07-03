export function insertProjectId(projectIds: string[], projectId: string, targetIndex: number) {
  const withoutProjectId = projectIds.filter((currentId) => currentId !== projectId);
  const safeIndex = Math.max(0, Math.min(targetIndex, withoutProjectId.length));

  return [...withoutProjectId.slice(0, safeIndex), projectId, ...withoutProjectId.slice(safeIndex)];
}
