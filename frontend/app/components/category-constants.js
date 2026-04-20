export const STORAGE_LABELS_KEY = "todo-category-labels";
export const STORAGE_ORDER_KEY = "todo-category-order";
export const STORAGE_PROJECTS_KEY = "todo-project-list";
export const STORAGE_ACTIVE_PROJECT_KEY = "todo-active-project";

export const DEFAULT_CATEGORY_LABELS = {
  backend: "Backend FastAPI",
  frontend: "Frontend Next.js",
};

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
