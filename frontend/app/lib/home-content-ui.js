export function buildTruncationMessage({ loadedCount, totalCount, truncated }) {
  if (!truncated) {
    return "";
  }

  return `Affichage partiel: ${loadedCount} tache(s) chargee(s) sur ${totalCount}. Utilise la pagination API (limit/offset) pour parcourir le reste.`;
}

export function buildPaginationUi({
  offset,
  loadedCount,
  totalCount,
  pageSize,
  isLoading,
}) {
  const safeOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;
  const safeLoadedCount = Number.isFinite(loadedCount)
    ? Math.max(0, loadedCount)
    : 0;
  const safeTotalCount = Number.isFinite(totalCount)
    ? Math.max(0, totalCount)
    : 0;
  const safePageSize = Number.isFinite(pageSize) ? Math.max(1, pageSize) : 1;

  const pageStart = safeTotalCount === 0 ? 0 : safeOffset + 1;
  const pageEnd = safeOffset + safeLoadedCount;
  const canGoPrevious = safeOffset > 0;
  const canGoNext = pageEnd < safeTotalCount;

  return {
    shouldShow: safeTotalCount > safePageSize || safeOffset > 0,
    pageStart,
    pageEnd,
    canGoPrevious,
    canGoNext,
    previousDisabled: !canGoPrevious || isLoading,
    nextDisabled: !canGoNext || isLoading,
    label: `Taches ${pageStart} a ${pageEnd} sur ${safeTotalCount}`,
  };
}
