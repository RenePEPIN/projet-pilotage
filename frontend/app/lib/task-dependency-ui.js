import { toUiStatus } from "./status-utils";

function toTaskId(value) {
  return String(value);
}

export function isTaskBlocked(task, allTasks) {
  if (!task?.parentTaskId || !Array.isArray(allTasks)) {
    return false;
  }

  const parentTask = allTasks.find(
    (candidate) => toTaskId(candidate.id) === toTaskId(task.parentTaskId),
  );

  return Boolean(parentTask) && toUiStatus(parentTask.etat) !== "terminee";
}

export function sortTasksByDependencies(tasksToSort, allTasks) {
  if (!Array.isArray(tasksToSort) || tasksToSort.length === 0) {
    return [];
  }

  const sourceTasks = Array.isArray(allTasks) ? allTasks : tasksToSort;
  const taskById = new Map(
    sourceTasks.map((task) => [toTaskId(task.id), task]),
  );
  const displayTaskIds = new Set(tasksToSort.map((task) => toTaskId(task.id)));
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(task) {
    const taskId = toTaskId(task.id);

    if (visited.has(taskId) || visiting.has(taskId)) {
      return;
    }

    visiting.add(taskId);

    if (task.parentTaskId) {
      const parentTask = taskById.get(toTaskId(task.parentTaskId));
      if (parentTask) {
        visit(parentTask);
      }
    }

    visiting.delete(taskId);
    visited.add(taskId);

    if (displayTaskIds.has(taskId)) {
      sorted.push(task);
    }
  }

  tasksToSort.forEach((task) => visit(task));
  return sorted;
}
