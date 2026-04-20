/**
 * Navigation latérale (shell) :
 * - Par défaut : groupe **Navigation** (Backlog, Recherche) puis groupe **Projets**
 *   (**une ligne par projet** via `GET /projects/`) + lien catalogue.
 * - Surcharge optionnelle : `NEXT_PUBLIC_SHELL_NAV_JSON` remplace **toute** la nav
 *   (comportement déploiement / pas de fusion dynamique).
 *
 * Format JSON :
 * `[{"title":"Workspace","items":[{"href":"/backlog","label":"Backlog","icon":"BL"},...]}]`
 */

/** Liens fixes en tête du groupe Workspace. */
export const STATIC_WORKSPACE_HEAD = [
  { href: "/backlog", label: "Backlog", icon: "BL" },
  { href: "/search", label: "Recherche", icon: "RQ" },
];

/** Lien catalogue (fin du bloc « Projets » dans la barre latérale). */
export const STATIC_PROJECT_CATALOG_LINK = {
  href: "/projects",
  label: "Tous les projets",
  icon: "PR",
};

/** Titres de groupes (barre latérale). */
export const SHELL_NAV_GROUP_TITLES = {
  navigation: "Navigation",
  projects: "Projets",
};

/** Icône 2 caractères (initiales / préfixe). */
export function shellNavIconFromLabel(name) {
  const s = String(name || "")
    .trim()
    .replace(/\s+/g, "");
  if (s.length >= 2) {
    return s.slice(0, 2).toUpperCase();
  }
  if (s.length === 1) {
    return `${s}${s}`.toUpperCase();
  }
  return "PJ";
}

/**
 * @param {Array<{ id: string, name?: string }>} projects
 * @returns {Array<{ href: string, label: string, icon: string }>}
 */
export function projectItemsForShellNav(projects) {
  if (!Array.isArray(projects)) {
    return [];
  }
  return projects.map((p) => {
    const id = String(p.id ?? "").trim();
    const label = String(p.name ?? id).trim() || id;
    return {
      href: `/projects/${encodeURIComponent(id)}/dashboard`,
      label,
      icon: shellNavIconFromLabel(p.name ?? id),
    };
  });
}

/**
 * Navigation par défaut (sans JSON d’environnement), alimentée par la liste projets API.
 * @param {Array<{ id: string, name?: string }>} projects
 */
export function buildDefaultShellNavFromProjects(projects) {
  const projectLinks = projectItemsForShellNav(projects);
  const catalogAndProjects = [...projectLinks, STATIC_PROJECT_CATALOG_LINK];

  return [
    {
      title: SHELL_NAV_GROUP_TITLES.navigation,
      items: [...STATIC_WORKSPACE_HEAD],
    },
    {
      title: SHELL_NAV_GROUP_TITLES.projects,
      items: catalogAndProjects,
    },
  ];
}

/** `true` si `NEXT_PUBLIC_SHELL_NAV_JSON` est défini : pas de fusion avec les projets API. */
export function hasShellNavEnvOverride() {
  if (typeof process === "undefined" || !process.env) {
    return false;
  }
  return Boolean(String(process.env.NEXT_PUBLIC_SHELL_NAV_JSON || "").trim());
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateNavGroups(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  const groups = [];
  for (const group of data) {
    if (!group || typeof group !== "object") {
      return null;
    }
    const title = group.title;
    const items = group.items;
    if (
      !isNonEmptyString(title) ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return null;
    }
    const normalizedItems = [];
    for (const item of items) {
      if (!item || typeof item !== "object") {
        return null;
      }
      const { href, label, icon } = item;
      if (
        !isNonEmptyString(href) ||
        !isNonEmptyString(label) ||
        !isNonEmptyString(icon)
      ) {
        return null;
      }
      normalizedItems.push({
        href: String(href).trim(),
        label: String(label).trim(),
        icon: String(icon).trim(),
      });
    }
    groups.push({ title: String(title).trim(), items: normalizedItems });
  }
  return groups;
}

/** Navigation entièrement pilotée par `NEXT_PUBLIC_SHELL_NAV_JSON` (validation stricte). */
export function getShellNavGroupsFromEnv() {
  if (typeof process === "undefined" || !process.env) {
    return null;
  }
  const raw = process.env.NEXT_PUBLIC_SHELL_NAV_JSON;
  if (!raw || !String(raw).trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return validateNavGroups(parsed);
  } catch {
    return null;
  }
}

/**
 * Résout la nav shell : JSON env valide → prioritaire ; sinon liste par défaut + projets API.
 * @param {Array<{ id: string, name?: string }>} projects
 */
export function resolveShellNavGroups(projects) {
  const fromEnv = getShellNavGroupsFromEnv();
  if (fromEnv) {
    return fromEnv;
  }
  return buildDefaultShellNavFromProjects(projects);
}

/**
 * Indique si le lien shell doit apparaître actif pour le chemin courant.
 * Les URL sous `/projects/{id}/…` (kanban, dashboard, etc.) activent le même raccourci projet.
 * @param {string} pathname
 * @param {string} href
 */
export function shellNavItemIsActive(pathname, href) {
  if (!pathname || !href) {
    return false;
  }
  if (href === "/backlog") {
    return pathname === "/backlog" || pathname.startsWith("/backlog/");
  }
  if (href === "/search") {
    return pathname === "/search";
  }
  if (href === "/projects") {
    return pathname === "/projects";
  }
  const projectBase = href.match(/^(\/projects\/[^/]+)(?:\/|$)/);
  if (projectBase) {
    const base = projectBase[1];
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
