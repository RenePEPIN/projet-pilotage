"use client";

import { useEffect, useMemo, useState } from "react";
import { sortTasksByDependencies } from "../lib/task-dependency-ui";
import { toUiStatus } from "../lib/status-utils";
import { DEFAULT_CATEGORY_LABELS } from "../components/category-constants";

/**
 * Filtres / tris du tableau (statut, catégorie, tri) et vues dérivées.
 */
export function useBoardFilters({
  activeProjectId,
  activeView,
  tasks,
  calendarTasks,
  isLoadingCalendar,
  isLoadingTasks,
  taskError,
  categoryOrder,
}) {
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    setStatusFilter(null);
    setCategoryFilter("all");
    setSortBy("default");
  }, [activeProjectId]);

  const availableCategoryKeys = useMemo(() => {
    const taskSections = tasks
      .map((tache) => tache.section || "autre")
      .filter(
        (section, index, sections) => sections.indexOf(section) === index,
      );

    return categoryOrder.filter(
      (section) =>
        DEFAULT_CATEGORY_LABELS[section] || taskSections.includes(section),
    );
  }, [categoryOrder, tasks]);

  useEffect(() => {
    if (categoryFilter === "all") {
      return;
    }
    if (!availableCategoryKeys.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [availableCategoryKeys, categoryFilter]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((tache) => {
      const matchesStatus =
        statusFilter === null || toUiStatus(tache.etat) === statusFilter;
      const sectionKey = String(tache.section || "autre")
        .trim()
        .toLowerCase();
      const filterKey = String(categoryFilter).trim().toLowerCase();
      const matchesCategory =
        categoryFilter === "all" || sectionKey === filterKey;

      return matchesStatus && matchesCategory;
    });
  }, [categoryFilter, statusFilter, tasks]);

  const calendarFilteredTasks = useMemo(() => {
    return calendarTasks.filter((tache) => {
      const matchesStatus =
        statusFilter === null || toUiStatus(tache.etat) === statusFilter;
      const sectionKey = String(tache.section || "autre")
        .trim()
        .toLowerCase();
      const filterKey = String(categoryFilter).trim().toLowerCase();
      const matchesCategory =
        categoryFilter === "all" || sectionKey === filterKey;
      return matchesStatus && matchesCategory;
    });
  }, [calendarTasks, categoryFilter, statusFilter]);

  const groupedTasksByStatus = useMemo(() => {
    const statuses = ["aFaire", "enCours", "terminee"];
    const groups = {};
    statuses.forEach((status) => {
      groups[status] = [];
    });

    visibleTasks.forEach((tache) => {
      const status = toUiStatus(tache.etat);
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(tache);
    });

    return groups;
  }, [visibleTasks]);

  const sortedVisibleTasks = useMemo(() => {
    const list = [...visibleTasks];
    if (sortBy === "title") {
      list.sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
      return list;
    }
    if (sortBy === "due") {
      list.sort((a, b) => {
        const da = a.dueDate || "";
        const db = b.dueDate || "";
        if (da === db) return Number(a.id) - Number(b.id);
        return da.localeCompare(db);
      });
      return list;
    }
    if (sortBy === "id") {
      list.sort((a, b) => Number(a.id) - Number(b.id));
      return list;
    }
    return sortTasksByDependencies(list, tasks);
  }, [visibleTasks, sortBy, tasks]);

  const groupedForListView = useMemo(() => {
    const groups = { aFaire: [], enCours: [], terminee: [] };
    sortedVisibleTasks.forEach((tache) => {
      const status = toUiStatus(tache.etat);
      if (groups[status]) {
        groups[status].push(tache);
      }
    });
    return groups;
  }, [sortedVisibleTasks]);

  const kpiTasks =
    activeView === "calendar" ? calendarFilteredTasks : visibleTasks;
  const total = kpiTasks.length;
  const aFaire = kpiTasks.filter(
    (tache) => toUiStatus(tache.etat) === "aFaire",
  ).length;
  const enCours = kpiTasks.filter(
    (tache) => toUiStatus(tache.etat) === "enCours",
  ).length;
  const terminees = kpiTasks.filter(
    (tache) => toUiStatus(tache.etat) === "terminee",
  ).length;

  function resetBoardFilters() {
    setStatusFilter(null);
    setCategoryFilter("all");
    setSortBy("default");
  }

  const filtersHideAllTasks =
    !taskError &&
    !isLoadingTasks &&
    (activeView === "calendar"
      ? !isLoadingCalendar &&
        calendarTasks.length > 0 &&
        calendarFilteredTasks.length === 0
      : tasks.length > 0 && visibleTasks.length === 0);

  return {
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    availableCategoryKeys,
    visibleTasks,
    calendarFilteredTasks,
    groupedTasksByStatus,
    sortedVisibleTasks,
    groupedForListView,
    total,
    aFaire,
    enCours,
    terminees,
    resetBoardFilters,
    filtersHideAllTasks,
  };
}
