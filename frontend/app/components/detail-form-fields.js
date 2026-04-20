"use client";

/**
 * Champs du formulaire tâche (présentation uniquement).
 * L’état et les effets restent dans `detail-form.js`.
 */

export function DetailFormFields({
  dispatch,
  isLoadingProjects,
  isLoadingTask,
  errorMessage,
  titre,
  description,
  etat,
  section,
  projectId,
  dueDate,
  parentTaskId,
  categoryLabels,
  categoryOrder,
  projects,
  projectTasks,
  idTache,
  isModification,
}) {
  return (
    <>
      {isLoadingProjects ? <p>Chargement des projets...</p> : null}
      {isLoadingTask ? <p>Chargement de la tache...</p> : null}
      {errorMessage ? <p className="info-banner">{errorMessage}</p> : null}

      <label className="field-row" htmlFor="titre">
        <span>Titre</span>
        <input
          className="ui-input"
          type="text"
          id="titre"
          name="tache_titre"
          value={titre}
          onChange={(event) =>
            dispatch({
              type: "SET_FIELD",
              field: "titre",
              value: event.target.value,
            })
          }
          required
        />
      </label>

      <label className="field-row" htmlFor="description">
        <span>Description</span>
        <input
          className="ui-input"
          type="text"
          id="description"
          name="tache_description"
          value={description}
          onChange={(event) =>
            dispatch({
              type: "SET_FIELD",
              field: "description",
              value: event.target.value,
            })
          }
        />
      </label>

      <label className="field-row" htmlFor="etat">
        <span>Etat</span>
        <select
          className="ui-select"
          id="etat"
          name="tache_etat"
          value={etat}
          onChange={(event) =>
            dispatch({
              type: "SET_FIELD",
              field: "etat",
              value: event.target.value,
            })
          }
          required
        >
          <option value="aFaire">A Faire</option>
          <option value="enCours">En Cours</option>
          <option value="terminee">Terminee</option>
        </select>
      </label>

      <label className="field-row" htmlFor="projectId">
        <span>Projet</span>
        <select
          className="ui-select"
          id="projectId"
          name="projectId"
          value={projectId}
          onChange={(event) =>
            dispatch({
              type: "SET_FIELD",
              field: "projectId",
              value: event.target.value,
            })
          }
          required
          disabled={isLoadingProjects}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field-row" htmlFor="section">
        <span>Categorie</span>
        <select
          className="ui-select"
          id="section"
          name="section"
          value={section}
          onChange={(event) =>
            dispatch({
              type: "SET_FIELD",
              field: "section",
              value: event.target.value,
            })
          }
          required={!isModification}
        >
          <option value="">--Choisir une categorie--</option>
          {categoryOrder.map((categoryKey) => (
            <option key={categoryKey} value={categoryKey}>
              {categoryLabels[categoryKey] ?? categoryKey}
            </option>
          ))}
        </select>
      </label>

      <label className="field-row" htmlFor="parentTaskId">
        <span>Tache parente</span>
        <select
          className="ui-select"
          id="parentTaskId"
          name="parentTaskId"
          value={parentTaskId || ""}
          onChange={(event) =>
            dispatch({
              type: "SET_FIELD",
              field: "parentTaskId",
              value: event.target.value || null,
            })
          }
        >
          <option value="">-- Aucune (tache racine) --</option>
          {projectTasks
            .filter((t) => t.id !== idTache)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.titre}
              </option>
            ))}
        </select>
      </label>

      <label className="field-row" htmlFor="dueDate">
        <span>Echeance</span>
        <input
          className="ui-input"
          type="date"
          id="dueDate"
          name="dueDate"
          value={dueDate}
          onChange={(event) =>
            dispatch({
              type: "SET_FIELD",
              field: "dueDate",
              value: event.target.value,
            })
          }
        />
      </label>
    </>
  );
}
