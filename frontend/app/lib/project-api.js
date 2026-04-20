import { slugify } from "../components/category-constants";
import { request } from "./api-client";

function extractProjectList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.projects)) {
    return payload.projects;
  }
  return [];
}

export async function getProjects() {
  const payload = await request("/projects/");
  return extractProjectList(payload);
}

export async function getDefaultProjects() {
  const payload = await request("/projects/defaults");
  if (Array.isArray(payload?.defaults)) {
    return payload.defaults;
  }
  return [];
}

export async function createProject(name) {
  const trimmed = name.trim();
  const id = slugify(trimmed) || "projet";
  return request("/projects/", {
    method: "POST",
    body: JSON.stringify({ id, name: trimmed }),
  });
}

export async function renameProject(projectId, name) {
  const trimmed = name.trim();
  return request(`/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: JSON.stringify({ name: trimmed }),
  });
}
