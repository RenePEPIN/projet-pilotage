"use client";

import { useEffect, useState } from "react";
import {
  buildPaginationUi,
  buildTruncationMessage,
} from "../lib/home-content-ui";
import { getAllTasksByProjectId, getTasksByProjectId } from "../lib/task-api";
import { TASKS_PAGE_SIZE } from "../lib/board-constants";

/**
 * Chargement des tâches (pagination API), vue calendrier (toutes les pages),
 * et contrôles de pagination.
 */
export function useBoardTasksPaging({ activeProjectId, activeView }) {
  const [tasksOffset, setTasksOffset] = useState(0);
  const [tasksReloadTick, setTasksReloadTick] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [taskPagination, setTaskPagination] = useState({
    limit: TASKS_PAGE_SIZE,
    offset: 0,
    count: 0,
    truncated: false,
  });
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  useEffect(() => {
    setTasksOffset(0);
  }, [activeProjectId]);

  useEffect(() => {
    let isMounted = true;

    async function loadTasksForProject() {
      if (!activeProjectId) {
        setTasks([]);
        setTaskPagination({
          limit: TASKS_PAGE_SIZE,
          offset: 0,
          count: 0,
          truncated: false,
        });
        return;
      }

      try {
        setIsLoadingTasks(true);
        setTaskError("");
        const nextTasks = await getTasksByProjectId(activeProjectId, {
          limit: TASKS_PAGE_SIZE,
          offset: tasksOffset,
          includeMeta: true,
        });
        if (isMounted) {
          if (
            nextTasks.tasks.length === 0 &&
            nextTasks.pagination.count > 0 &&
            tasksOffset > 0
          ) {
            setTasksOffset((prev) => Math.max(0, prev - TASKS_PAGE_SIZE));
            return;
          }
          setTasks(nextTasks.tasks);
          setTaskPagination(nextTasks.pagination);
        }
      } catch (error) {
        if (isMounted) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : "Impossible de charger les taches depuis l'API.";
          setTaskError(errorMsg);
          setTaskPagination((prev) => ({ ...prev, truncated: false }));
        }
      } finally {
        if (isMounted) {
          setIsLoadingTasks(false);
        }
      }
    }

    loadTasksForProject();
    return () => {
      isMounted = false;
    };
  }, [activeProjectId, tasksOffset, tasksReloadTick]);

  useEffect(() => {
    if (!activeProjectId || activeView !== "calendar") {
      return;
    }
    let cancelled = false;
    setIsLoadingCalendar(true);
    setCalendarTasks([]);
    getAllTasksByProjectId(activeProjectId)
      .then((all) => {
        if (!cancelled) {
          setCalendarTasks(all);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCalendarTasks([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCalendar(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, activeView, tasksReloadTick]);

  const truncationMessage = buildTruncationMessage({
    loadedCount: tasks.length,
    totalCount: taskPagination.count,
    truncated: taskPagination.truncated,
  });
  const paginationUi = buildPaginationUi({
    offset: taskPagination.offset,
    loadedCount: tasks.length,
    totalCount: taskPagination.count,
    pageSize: TASKS_PAGE_SIZE,
    isLoading: isLoadingTasks,
  });

  function goToPreviousPage() {
    setTasksOffset((prev) => Math.max(0, prev - TASKS_PAGE_SIZE));
  }

  function goToNextPage() {
    if (!paginationUi.canGoNext) {
      return;
    }
    setTasksOffset((prev) => prev + TASKS_PAGE_SIZE);
  }

  function bumpTasksReload() {
    setTasksReloadTick((prev) => prev + 1);
  }

  return {
    tasks,
    taskPagination,
    isLoadingTasks,
    taskError,
    setTaskError,
    bumpTasksReload,
    truncationMessage,
    paginationUi,
    goToPreviousPage,
    goToNextPage,
    calendarTasks,
    isLoadingCalendar,
  };
}
