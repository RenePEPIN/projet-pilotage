import { request } from "./api-client";
import { toApiStatus, toUiStatus } from "./status-utils";

const DEFAULT_LIMIT = 100;

/** Limite de pages en boucle (recherche globale / calendrier) si la base grossit anormalement. */
const MAX_TASK_FETCH_PAGES = 500;

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
  const offsetRaw = payload?.offset;
  const offset =
    offsetRaw === null || offsetRaw === undefined
      ? 0
      : toPaginationNumber(offsetRaw, 0);
  const count = toPaginationNumber(payload?.count, rawTasks.length);

  const raw = payload || {};
  let nextAfterId = null;
  let truncated;
  if ("next_after_id" in raw) {
    const v = raw.next_after_id;
    nextAfterId = v !== null && v !== undefined && v !== "" ? Number(v) : null;
    truncated =
      nextAfterId !== null && Number.isFinite(nextAfterId) && nextAfterId > 0;
  } else {
    truncated = count > offset + tasks.length;
  }

  return {
    tasks,
    pagination: {
      limit,
      offset,
      count,
      nextAfterId,
      truncated,
    },
  };
}

function buildTasksQueryString({ limit, offset, afterId, projectId }) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (afterId != null) {
    params.set("after_id", String(afterId));
  } else {
    params.set("offset", String(offset));
  }
  if (projectId != null) {
    params.set("project_id", projectId);
  }
  return params.toString();
}

export async function getTasks({
  limit = DEFAULT_LIMIT,
  offset = 0,
  afterId = null,
  includeMeta = false,
} = {}) {
  const payload = await request(
    `/taches/?${buildTasksQueryString({
      limit,
      offset,
      afterId,
      projectId: null,
    })}`,
  );
  const normalized = normalizeTaskCollection(payload);
  return includeMeta ? normalized : normalized.tasks;
}

export async function getTasksByProjectId(
  projectId,
  {
    limit = DEFAULT_LIMIT,
    offset = 0,
    afterId = null,
    includeMeta = false,
  } = {},
) {
  const payload = await request(
    `/taches/?${buildTasksQueryString({ limit, offset, afterId, projectId })}`,
  );
  const normalized = normalizeTaskCollection(payload);
  return includeMeta ? normalized : normalized.tasks;
}

export async function getAllTasksByProjectId(projectId) {
  /**
   * QW-50: Load all tasks for a project across all pages.
   * Useful for parent task selection in forms to avoid incomplete lists.
   */
  const allTasks = [];
  let afterId = null;
  let offset = 0;
  let pages = 0;

  while (pages < MAX_TASK_FETCH_PAGES) {
    pages += 1;
    const useCursor = afterId != null;
    const normalized = await getTasksByProjectId(projectId, {
      limit: DEFAULT_LIMIT,
      ...(useCursor ? { afterId } : { offset }),
      includeMeta: true,
    });
    allTasks.push(...normalized.tasks);
    const { nextAfterId, truncated } = normalized.pagination;
    if (nextAfterId != null && Number.isFinite(nextAfterId)) {
      afterId = nextAfterId;
      continue;
    }
    if (!truncated) {
      break;
    }
    offset += DEFAULT_LIMIT;
  }

  return allTasks;
}

/**
 * Toutes les taches (tous projets), pagination API globale.
 * Utile pour la vue Backlog transversale.
 */
export async function getAllTasksGlobal() {
  const allTasks = [];
  let afterId = null;
  let offset = 0;
  let pages = 0;
  let hasMore = true;

  while (hasMore && pages < MAX_TASK_FETCH_PAGES) {
    pages += 1;
    const useCursor = afterId != null;
    const normalized = await getTasks({
      limit: DEFAULT_LIMIT,
      ...(useCursor ? { afterId } : { offset }),
      includeMeta: true,
    });
    allTasks.push(...normalized.tasks);
    const { nextAfterId, truncated } = normalized.pagination;
    if (nextAfterId != null && Number.isFinite(nextAfterId)) {
      afterId = nextAfterId;
      hasMore = true;
      continue;
    }
    hasMore = truncated;
    if (!hasMore) {
      break;
    }
    offset += DEFAULT_LIMIT;
  }

  if (hasMore) {
    console.warn(
      `[task-api] getAllTasksGlobal: arret apres ${MAX_TASK_FETCH_PAGES} pages (plafond de securite).`,
    );
  }

  return allTasks;
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

export async function patchTaskEtat(taskId, uiStatus) {
  const payload = await request(`/taches/${taskId}`, {
    method: "PUT",
    body: JSON.stringify({ etat: toApiStatus(uiStatus) }),
  });
  return normalizeFromApi(payload);
}

export async function deleteTask(taskId) {
  await request(`/taches/${taskId}`, { method: "DELETE" });
}
