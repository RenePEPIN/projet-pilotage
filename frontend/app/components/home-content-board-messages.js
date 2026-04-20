"use client";

/**
 * Bannières d’état : chargement, erreurs API, filtres vides, troncature.
 */
export function HomeContentBoardMessages({
  actionInfo,
  info,
  isLoadingProjects,
  projectError,
  isLoadingTasks,
  taskError,
  filtersHideAllTasks,
  resetBoardFilters,
  truncationMessage,
}) {
  return (
    <>
      {(actionInfo || info) && (
        <p id="info" className="info-banner" role="status" aria-live="polite">
          {actionInfo || info}
        </p>
      )}

      {isLoadingProjects ? (
        <p className="info-banner" role="status" aria-live="polite">
          Chargement des projets...
        </p>
      ) : null}

      {projectError ? (
        <p className="info-banner" role="alert">
          {projectError}
        </p>
      ) : null}

      {isLoadingTasks ? (
        <p className="info-banner" role="status" aria-live="polite">
          Chargement des taches...
        </p>
      ) : null}

      {taskError ? (
        <p className="info-banner" role="alert">
          {taskError}
        </p>
      ) : null}

      {filtersHideAllTasks ? (
        <p className="info-banner" role="status">
          Aucune tache ne correspond aux filtres actifs (statut ou categorie).{" "}
          <button
            type="button"
            className="ui-btn ui-btn-secondary"
            onClick={resetBoardFilters}
          >
            Reinitialiser les filtres
          </button>
        </p>
      ) : null}

      {truncationMessage ? (
        <p className="info-banner" role="status" aria-live="polite">
          {truncationMessage}
        </p>
      ) : null}
    </>
  );
}
