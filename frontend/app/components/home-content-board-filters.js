"use client";

/**
 * Filtres statut / catégorie / tri (masque le tri si vue calendrier ou tableau de bord).
 */
export function HomeContentBoardFilters({
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  availableCategoryKeys,
  categoryLabels,
  sortBy,
  setSortBy,
  activeView,
}) {
  return (
    <div className="board-filters">
      <div className="board-filters-status">
        <span className="segment-label board-filters-label">Statut</span>
        <div
          className="chip-row chip-row-tight"
          aria-label="Filtres par statut"
        >
          <button
            type="button"
            className={`chip${statusFilter === null ? " active" : ""}`}
            onClick={() => setStatusFilter(null)}
            aria-pressed={statusFilter === null}
          >
            Toutes
          </button>
          <button
            type="button"
            className={`chip${statusFilter === "aFaire" ? " active" : ""}`}
            onClick={() => setStatusFilter("aFaire")}
            aria-pressed={statusFilter === "aFaire"}
          >
            A faire
          </button>
          <button
            type="button"
            className={`chip${statusFilter === "enCours" ? " active" : ""}`}
            onClick={() => setStatusFilter("enCours")}
            aria-pressed={statusFilter === "enCours"}
          >
            En cours
          </button>
          <button
            type="button"
            className={`chip${statusFilter === "terminee" ? " active" : ""}`}
            onClick={() => setStatusFilter("terminee")}
            aria-pressed={statusFilter === "terminee"}
          >
            Terminees
          </button>
        </div>
      </div>

      <div className="board-filters-category">
        <label
          className="segment-label board-filters-label"
          htmlFor="board-category-filter"
        >
          Categorie
        </label>
        <select
          id="board-category-filter"
          className="ui-select category-filter-select"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filtrer les taches par categorie"
        >
          <option value="all">Toutes les categories</option>
          {availableCategoryKeys.map((categoryKey) => (
            <option key={categoryKey} value={categoryKey}>
              {categoryLabels[categoryKey] ?? categoryKey}
            </option>
          ))}
        </select>
      </div>

      {activeView !== "calendar" && activeView !== "dashboard" ? (
        <div className="board-filters-sort">
          <label
            className="segment-label board-filters-label"
            htmlFor="board-sort"
          >
            Trier
          </label>
          <select
            id="board-sort"
            className="ui-select category-filter-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Trier les taches"
          >
            <option value="default">Defaut (dependances)</option>
            <option value="title">Titre (A-Z)</option>
            <option value="due">Echeance</option>
            <option value="id">Numero de tache</option>
          </select>
        </div>
      ) : null}
    </div>
  );
}
