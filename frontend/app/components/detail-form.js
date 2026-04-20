"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { useProjects } from "../hooks/use-projects";
import {
  createTask,
  getTaskById,
  getTasksByProjectId,
  updateTask,
} from "../lib/task-api";
import {
  DEFAULT_CATEGORY_LABELS,
  STORAGE_LABELS_KEY,
  STORAGE_ORDER_KEY,
} from "./category-constants";

const initialState = {
  categoryLabels: DEFAULT_CATEGORY_LABELS,
  categoryOrder: Object.keys(DEFAULT_CATEGORY_LABELS),
  titre: "",
  description: "",
  etat: "aFaire",
  section: "",
  projectId: null,
  dueDate: "",
  parentTaskId: null,
  projectTasks: [],
  errorMessage: "",
  isSubmitting: false,
  isLoadingTask: false,
};

function formReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "LOAD_TASK":
      return {
        ...state,
        titre: action.task.titre || "",
        description: action.task.description || "",
        etat: action.task.etat || "aFaire",
        section: action.task.section || state.categoryOrder[0] || "",
        dueDate: action.task.dueDate || "",
        parentTaskId: action.task.parentTaskId || null,
        projectId: action.task.projectId || state.projectId,
        isLoadingTask: false,
      };
    default:
      return state;
  }
}

export default function DetailForm({ searchParams }) {
  const router = useRouter();
  const idTache = searchParams?.tache;
  const isModification = !!idTache;
  const initialSection = "";
  const initialProjectId = searchParams?.projectId || null;

  const [state, dispatch] = useReducer(formReducer, {
    ...initialState,
    projectId: initialProjectId,
    isLoadingTask: isModification,
  });

  const {
    categoryLabels,
    categoryOrder,
    titre,
    description,
    etat,
    section,
    projectId,
    dueDate,
    parentTaskId,
    projectTasks,
    errorMessage,
    isSubmitting,
    isLoadingTask,
  } = state;

  const { projects, isLoadingProjects, projectError } = useProjects();
  const destinationUrl = `/projects/${projectId}`;

  // Track projectId from task loading to distinguish user changes from API loads
  const projectIdFromTaskLoadRef = useRef(null);

  const sectionLabel = useMemo(
    () => categoryLabels[section] ?? "",
    [categoryLabels, section],
  );

  const projectName = useMemo(
    () => projects.find((project) => project.id === projectId)?.name ?? "",
    [projects, projectId],
  );

  useEffect(() => {
    const storedLabels = window.localStorage.getItem(STORAGE_LABELS_KEY);
    const storedOrder = window.localStorage.getItem(STORAGE_ORDER_KEY);

    if (storedLabels) {
      try {
        dispatch({
          type: "SET_FIELD",
          field: "categoryLabels",
          value: { ...DEFAULT_CATEGORY_LABELS, ...JSON.parse(storedLabels) },
        });
      } catch {
        // Ignore invalid localStorage payload
      }
    }

    if (storedOrder) {
      try {
        const parsedOrder = JSON.parse(storedOrder);
        if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
          dispatch({
            type: "SET_FIELD",
            field: "categoryOrder",
            value: parsedOrder,
          });
          if (!initialSection && parsedOrder.length > 0) {
            dispatch({
              type: "SET_FIELD",
              field: "section",
              value: parsedOrder[0],
            });
          }
        }
      } catch {
        // Ignore invalid localStorage payload
      }
    }

    return undefined;
  }, [initialSection]);

  useEffect(() => {
    if (!Array.isArray(projects) || projects.length === 0) {
      return;
    }

    if (initialProjectId) {
      if (!projects.some((project) => project.id === initialProjectId)) {
        dispatch({
          type: "SET_FIELD",
          field: "projectId",
          value: projects[0].id,
        });
      }
    } else if (!projectId) {
      dispatch({
        type: "SET_FIELD",
        field: "projectId",
        value: projects[0].id,
      });
    }
  }, [initialProjectId, projects, projectId]);

  useEffect(() => {
    if (projectError) {
      dispatch({
        type: "SET_FIELD",
        field: "errorMessage",
        value: projectError,
      });
    }
  }, [projectError]);

  useEffect(() => {
    if (!isModification) {
      return;
    }

    let isMounted = true;

    async function loadTask() {
      try {
        dispatch({ type: "SET_FIELD", field: "errorMessage", value: "" });
        const task = await getTaskById(idTache);
        if (!isMounted) {
          return;
        }

        if (task.projectId) {
          projectIdFromTaskLoadRef.current = task.projectId;
        }
        dispatch({ type: "LOAD_TASK", task });
      } catch {
        if (isMounted) {
          dispatch({
            type: "SET_FIELD",
            field: "errorMessage",
            value: "Impossible de charger la tache depuis l'API.",
          });
          dispatch({ type: "SET_FIELD", field: "isLoadingTask", value: false });
        }
      }
    }

    loadTask();
    return () => {
      isMounted = false;
    };
  }, [categoryOrder, idTache, initialSection, isModification]);

  useEffect(() => {
    if (!projectId) {
      dispatch({ type: "SET_FIELD", field: "parentTaskId", value: null });
      dispatch({ type: "SET_FIELD", field: "projectTasks", value: [] });
      return;
    }

    let isMounted = true;

    // Only reset parentTaskId if projectId changed due to user action, not task loading
    const isUserInitiatedChange =
      projectIdFromTaskLoadRef.current !== projectId;
    if (isUserInitiatedChange) {
      dispatch({ type: "SET_FIELD", field: "parentTaskId", value: null });
    }

    getTasksByProjectId(projectId)
      .then((tasks) => {
        if (isMounted) {
          dispatch({ type: "SET_FIELD", field: "projectTasks", value: tasks });
          projectIdFromTaskLoadRef.current = projectId;
        }
      })
      .catch(() => {
        if (isMounted) {
          dispatch({ type: "SET_FIELD", field: "projectTasks", value: [] });
          projectIdFromTaskLoadRef.current = projectId;
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  async function handleSubmit(event) {
    event.preventDefault();
    dispatch({ type: "SET_FIELD", field: "isSubmitting", value: true });
    dispatch({ type: "SET_FIELD", field: "errorMessage", value: "" });

    const payload = { titre, description, etat, dueDate, parentTaskId };
    const metadata = { section, projectId };

    try {
      if (isModification) {
        await updateTask(idTache, payload, metadata);
        router.push(`${destinationUrl}?modifier=${idTache}`);
      } else {
        const created = await createTask(payload, metadata);
        router.push(
          `${destinationUrl}?ajouter=${encodeURIComponent(created.id)}&section=${encodeURIComponent(section)}&sectionLabel=${encodeURIComponent(sectionLabel)}&projectName=${encodeURIComponent(projectName)}`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Enregistrement impossible. Verifie que l'API tourne.";
      dispatch({ type: "SET_FIELD", field: "errorMessage", value: message });
    } finally {
      dispatch({ type: "SET_FIELD", field: "isSubmitting", value: false });
    }
  }

  return (
    <main className="travel-shell detail-shell">
      <section className="hero-block compact">
        <div className="topbar">
          <span className="brand">App de pilotage</span>
          <Link href={destinationUrl} className="panel-link">
            Retour a la liste
          </Link>
        </div>

        <h1 id="titreH1">
          {isModification ? "Modifier une tache" : "Ajouter une nouvelle tache"}
        </h1>
        <p className="hero-subtitle">
          Renseigne les informations du lot frontend ou backend de maniere
          propre.
        </p>
      </section>

      <section id="tache" className="form-panel">
        <form className="detail-form" onSubmit={handleSubmit}>
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

          <div id="actions" className="action-row">
            {isModification ? (
              <>
                <button
                  type="submit"
                  id="lienModifier"
                  className="primary-cta small ui-btn ui-btn-primary"
                  disabled={isSubmitting || isLoadingTask}
                >
                  Modifier
                </button>
                <Link
                  href={`${destinationUrl}?annulerModifier=${idTache}`}
                  id="lienAnnulerModification"
                  className="action-link ui-btn ui-btn-secondary"
                >
                  Annuler
                </Link>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  id="lienAjouter"
                  className="primary-cta small ui-btn ui-btn-primary"
                  disabled={isSubmitting || isLoadingTask}
                >
                  Ajouter
                </button>
                <Link
                  href={`${destinationUrl}?annulerAjouter=1`}
                  id="lienAnnulerAjouter"
                  className="action-link ui-btn ui-btn-secondary"
                >
                  Annuler
                </Link>
              </>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
