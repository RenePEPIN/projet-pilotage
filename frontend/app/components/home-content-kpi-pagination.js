"use client";

/**
 * Bandeau KPI et barre de pagination (hors vue calendrier).
 */
export function HomeContentKpiPagination({
  total,
  aFaire,
  enCours,
  terminees,
  paginationUi,
  goToPreviousPage,
  goToNextPage,
  activeView,
}) {
  return (
    <>
      <section
        className="kpi-strip"
        id="tableau"
        aria-label="Synthese des taches filtrees"
      >
        <div className="kpi-strip-inner">
          <span className="kpi-strip-item">
            <span className="kpi-strip-label">Total</span>
            <span className="kpi-strip-value">{total}</span>
          </span>
          <span className="kpi-strip-sep" aria-hidden="true" />
          <span className="kpi-strip-item">
            <span className="kpi-strip-label">A faire</span>
            <span className="kpi-strip-value">{aFaire}</span>
          </span>
          <span className="kpi-strip-sep" aria-hidden="true" />
          <span className="kpi-strip-item">
            <span className="kpi-strip-label">En cours</span>
            <span className="kpi-strip-value">{enCours}</span>
          </span>
          <span className="kpi-strip-sep" aria-hidden="true" />
          <span className="kpi-strip-item">
            <span className="kpi-strip-label">Terminees</span>
            <span className="kpi-strip-value">{terminees}</span>
          </span>
        </div>
      </section>

      {paginationUi.shouldShow && activeView !== "calendar" ? (
        <div className="pagination-toolbar" aria-label="Pagination des taches">
          <button
            type="button"
            className="ui-btn ui-btn-secondary pagination-btn"
            onClick={goToPreviousPage}
            disabled={paginationUi.previousDisabled}
          >
            Precedent
          </button>
          <span className="pagination-meta" aria-live="polite">
            {paginationUi.label}
          </span>
          <button
            type="button"
            className="ui-btn ui-btn-secondary pagination-btn"
            onClick={goToNextPage}
            disabled={paginationUi.nextDisabled}
          >
            Suivant
          </button>
        </div>
      ) : null}
    </>
  );
}
