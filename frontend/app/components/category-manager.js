export default function CategoryManager({
  categoryOrder,
  categoryLabels,
  updateCategoryLabel,
  resetCategoryLabels,
  newCategoryLabel,
  setNewCategoryLabel,
  addCategory,
}) {
  return (
    <section className="todo-panel" id="categories">
      <div className="panel-head">
        <h2>Categories personnalisables</h2>
      </div>

      <p className="category-help">
        Tu peux changer le titre de chaque categorie ci-dessous. La sauvegarde
        est automatique.
      </p>

      <div className="category-grid">
        {categoryOrder.map((categoryKey) => (
          <label className="category-item" key={categoryKey}>
            <span>Nom de categorie</span>
            <input
              className="ui-input"
              type="text"
              value={categoryLabels[categoryKey] ?? categoryKey}
              onChange={(event) =>
                updateCategoryLabel(categoryKey, event.target.value)
              }
            />
          </label>
        ))}
      </div>

      <div className="category-tools">
        <button
          type="button"
          className="action-link ui-btn ui-btn-secondary"
          onClick={resetCategoryLabels}
        >
          Reinitialiser les titres
        </button>
      </div>

      <form className="add-category-form" onSubmit={addCategory}>
        <input
          className="ui-input"
          type="text"
          placeholder="Nouvelle categorie (ex: Mobile, DevOps)"
          value={newCategoryLabel}
          onChange={(event) => setNewCategoryLabel(event.target.value)}
        />
        <button
          type="submit"
          className="primary-cta small ui-btn ui-btn-primary"
        >
          Ajouter categorie
        </button>
      </form>
    </section>
  );
}
