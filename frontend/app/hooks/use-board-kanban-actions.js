"use client";

import { useState } from "react";
import { getTaskIdsForKanbanMove } from "../lib/task-move-tree";
import { deleteTask, patchTaskEtat } from "../lib/task-api";
import { STATUS_FILTER_LABELS } from "../lib/board-constants";

/**
 * Suppression et déplacement Kanban (y compris arborescence liée).
 */
export function useBoardKanbanActions({
  tasks,
  bumpTasksReload,
  setTaskError,
}) {
  const [movingTaskIds, setMovingTaskIds] = useState([]);
  const [actionInfo, setActionInfo] = useState("");

  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(taskId);
      setActionInfo(`La tache ${taskId} a ete supprimee avec succes`);
      bumpTasksReload();
    } catch {
      setTaskError("La suppression a echoue. Verifie que l'API tourne bien.");
    }
  }

  async function handleMoveTask(taskId, targetColumnKey) {
    setTaskError("");
    const idsToMove = getTaskIdsForKanbanMove(taskId, tasks);
    setMovingTaskIds(idsToMove);
    try {
      await Promise.all(
        idsToMove.map((id) => patchTaskEtat(id, targetColumnKey)),
      );
      const labelCol = STATUS_FILTER_LABELS[targetColumnKey] ?? targetColumnKey;
      const n = idsToMove.length;
      setActionInfo(
        n > 1
          ? `${n} taches liees deplacees vers « ${labelCol} »`
          : `Tache deplacee vers « ${labelCol} »`,
      );
      bumpTasksReload();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Impossible de deplacer la tache.";
      setTaskError(errorMsg);
    } finally {
      setMovingTaskIds([]);
    }
  }

  return {
    movingTaskIds,
    actionInfo,
    handleDeleteTask,
    handleMoveTask,
  };
}
