"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectsWithApiDecorated } from "./use-projects";
import { getAllTasksGlobal } from "../lib/task-api";

/**
 * Chargement transversal de toutes les tâches (pagination API côté client)
 * + projets décorés — partagé par recherche globale et backlog.
 */
export function usePilotageGlobalTasks() {
  const { projects, isLoadingProjects, projectError } =
    useProjectsWithApiDecorated();

  const projectById = useMemo(() => {
    const m = new Map();
    for (const p of projects) {
      m.set(String(p.id), p.name);
    }
    return m;
  }, [projects]);

  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState("");

  const loadTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    setTasksError("");
    try {
      const all = await getAllTasksGlobal();
      setTasks(all);
    } catch (err) {
      const suffix =
        err instanceof Error && err.message ? ` ${err.message}` : "";
      setTasksError(`Impossible de charger les taches.${suffix}`);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const isLoading = isLoadingProjects || isLoadingTasks;

  return {
    projectById,
    projectError,
    tasks,
    tasksError,
    loadTasks,
    isLoading,
  };
}
