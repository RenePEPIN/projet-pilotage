import { request } from "./api-client";
import { toApiStatus, toUiStatus } from "./status-utils";

const DEFAULT_LIMIT = 100;

function normalizeFromApi(task) {
  return {
    id: String(task.id),
    titre: task.titre,
    description: task.description || "",
    etat: toUiStatus(task.etat),
    section: task.section || "backend",
    projectId: task.project_id,
    parentTaskId: task.parent_task_id || null,
    dueDate: task.due_date || "",
  };
}

function normalizeToApi(task, metadata = {}) {
  return {
    titre: task.titre,
    description: task.description || "",
    etat: toApiStatus(task.etat),
    section: metadata.section || "backend",
    project_id: metadata.projectId || "projet-api-principal",
    due_date: task.dueDate || null,
    parent_task_id: task.parentTaskId ? Number(task.parentTaskId) : null,
  };
}

function extractTaskList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.taches)) {
    return payload.taches;
  }
  return [];
}

function toPaginationNumber(value, fallback) {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : fallback;
}

function normalizeTaskCollection(payload) {
  const rawTasks = extractTaskList(payload);
  const tasks = rawTasks.map(normalizeFromApi);
  const limit = toPaginationNumber(
    payload?.limit,
    rawTasks.length || DEFAULT_LIMIT,
  );
  const offset = toPaginationNumber(payload?.offset, 0);
  const count = toPaginationNumber(payload?.count, rawTasks.length);

  return {
    tasks,
    pagination: {
      limit,
      offset,
      count,
      truncated: count > offset + tasks.length,
    },
  };
}

export async function getTasks({
  limit = DEFAULT_LIMIT,
  offset = 0,
  includeMeta = false,
} = {}) {
  const payload = await request(`/taches/?limit=${limit}&offset=${offset}`);
  const normalized = normalizeTaskCollection(payload);
  return includeMeta ? normalized : normalized.tasks;
}

export async function getTasksByProjectId(
  projectId,
  { limit = DEFAULT_LIMIT, offset = 0, includeMeta = false } = {},
) {
  const payload = await request(
    `/taches/?project_id=${encodeURIComponent(projectId)}&limit=${limit}&offset=${offset}`,
  );
  const normalized = normalizeTaskCollection(payload);
  return includeMeta ? normalized : normalized.tasks;
}

export async function getTaskById(taskId) {
  const payload = await request(`/taches/${taskId}`);
  return normalizeFromApi(payload);
}

export async function createTask(task, metadata = {}) {
  const payload = await request("/taches/", {
    method: "POST",
    body: JSON.stringify(normalizeToApi(task, metadata)),
  });
  return normalizeFromApi(payload);
}

export async function updateTask(taskId, task, metadata = {}) {
  const payload = await request(`/taches/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(normalizeToApi(task, metadata)),
  });
  return normalizeFromApi(payload);
}

export async function deleteTask(taskId) {
  await request(`/taches/${taskId}`, { method: "DELETE" });
}
