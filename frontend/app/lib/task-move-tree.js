function toId(value) {
  return String(value ?? "");
}

export function findRootTask(taskId, allTasks) {
  if (!Array.isArray(allTasks) || allTasks.length === 0) {
    return null;
  }

  const byId = new Map(allTasks.map((t) => [toId(t.id), t]));
  let currentId = toId(taskId);
  const chain = new Set();

  while (currentId) {
    if (chain.has(currentId)) {
      break;
    }
    chain.add(currentId);

    const task = byId.get(currentId);
    if (!task) {
      return byId.get(toId(taskId)) ?? null;
    }
    if (!task.parentTaskId) {
      return task;
    }
    currentId = toId(task.parentTaskId);
  }

  return byId.get(toId(taskId)) ?? null;
}

export function collectSubtreeTaskIds(rootId, allTasks) {
  const root = toId(rootId);
  if (!root || !Array.isArray(allTasks)) {
    return [];
  }

  const out = [];
  const queue = [root];
  const seen = new Set();

  while (queue.length > 0) {
    const id = queue.shift();
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);

    for (const t of allTasks) {
      if (t.parentTaskId != null && toId(t.parentTaskId) === id) {
        queue.push(toId(t.id));
      }
    }
  }

  return out;
}

export function getTaskIdsForKanbanMove(taskId, allTasks) {
  const root = findRootTask(taskId, allTasks);
  if (!root) {
    return [toId(taskId)].filter(Boolean);
  }
  return collectSubtreeTaskIds(root.id, allTasks);
}
