"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { useProjects } from "../hooks/use-projects";
import {
  createTask,
  getAllTasksByProjectId,
  getTaskById,
  updateTask,
} from "../lib/task-api";
import {
  DEFAULT_CATEGORY_LABELS,
  STORAGE_LABELS_KEY,
  STORAGE_ORDER_KEY,
} from "./category-constants";
import { DetailFormActions } from "./detail-form-actions";
import { DetailFormFields } from "./detail-form-fields";

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

  /** Distinguer changement de projet utilisateur vs chargement depuis l’API. */
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
        /* JSON localStorage invalide : ignorer */
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
        /* JSON localStorage invalide : ignorer */
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
      } catch (error) {
        if (isMounted) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : "Impossible de charger la tache depuis l'API.";
          dispatch({
            type: "SET_FIELD",
            field: "errorMessage",
            value: errorMsg,
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

    const isUserInitiatedChange =
      projectIdFromTaskLoadRef.current !== projectId;
    if (isUserInitiatedChange) {
      dispatch({ type: "SET_FIELD", field: "parentTaskId", value: null });
    }

    getAllTasksByProjectId(projectId)
      .then((tasks) => {
        if (isMounted) {
          dispatch({ type: "SET_FIELD", field: "projectTasks", value: tasks });
          projectIdFromTaskLoadRef.current = projectId;
        }
      })
      .catch((error) => {
        if (isMounted) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : "Impossible de charger les taches parentes.";
          dispatch({
            type: "SET_FIELD",
            field: "errorMessage",
            value: errorMsg,
          });
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
          `${destinationUrl}?ajouter=${encodeURIComponent(
            created.id,
          )}&section=${encodeURIComponent(
            section,
          )}&sectionLabel=${encodeURIComponent(
            sectionLabel,
          )}&projectName=${encodeURIComponent(projectName)}`,
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
          <DetailFormFields
            dispatch={dispatch}
            isLoadingProjects={isLoadingProjects}
            isLoadingTask={isLoadingTask}
            errorMessage={errorMessage}
            titre={titre}
            description={description}
            etat={etat}
            section={section}
            projectId={projectId}
            dueDate={dueDate}
            parentTaskId={parentTaskId}
            categoryLabels={categoryLabels}
            categoryOrder={categoryOrder}
            projects={projects}
            projectTasks={projectTasks}
            idTache={idTache}
            isModification={isModification}
          />
          <DetailFormActions
            isModification={isModification}
            idTache={idTache}
            destinationUrl={destinationUrl}
            isSubmitting={isSubmitting}
            isLoadingTask={isLoadingTask}
          />
        </form>
      </section>
    </main>
  );
}
