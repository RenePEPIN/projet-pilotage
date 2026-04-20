"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProjects, getDefaultProjects } from "../lib/project-api";

export function useProjects({
  decorateProject = null,
  initialLoading = true,
} = {}) {
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(initialLoading);
  const [projectError, setProjectError] = useState("");
  const decorateProjectRef = useRef(decorateProject);

  useEffect(() => {
    decorateProjectRef.current = decorateProject;
  }, [decorateProject]);

  const refreshProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setProjectError("");

    try {
      // Charger les projets depuis l'API
      const nextProjects = await getProjects();

      // Si vide, charger les defaults depuis l'API
      let projectsToUse = nextProjects;
      if (!Array.isArray(nextProjects) || nextProjects.length === 0) {
        projectsToUse = await getDefaultProjects();
      }

      const normalizedProjects = Array.isArray(projectsToUse)
        ? projectsToUse
        : [];
      const projectDecorator = decorateProjectRef.current;
      setProjects(
        projectDecorator
          ? normalizedProjects.map((project) => projectDecorator(project))
          : normalizedProjects,
      );
    } catch {
      setProjectError("Impossible de charger les projets depuis l'API.");
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return {
    projects,
    isLoadingProjects,
    projectError,
    refreshProjects,
  };
}
