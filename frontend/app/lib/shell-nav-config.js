/**
 * Navigation latérale (shell) : valeurs par défaut ou surcharge via
 * `NEXT_PUBLIC_SHELL_NAV_JSON` (JSON string, injectée au build Next).
 *
 * Format attendu :
 * `[{"title":"Workspace","items":[{"href":"/backlog","label":"Backlog","icon":"BL"},...]}]`
 */

const FALLBACK_NAV_GROUPS = [
  {
    title: "Workspace",
    items: [
      { href: "/backlog", label: "Backlog", icon: "BL" },
      { href: "/search", label: "Recherche", icon: "RQ" },
      {
        href: "/projects/projet-api-principal/dashboard",
        label: "API Principal",
        icon: "AP",
      },
      {
        href: "/projects/lis-taches-apres-reunion/dashboard",
        label: "Post Reunion",
        icon: "RE",
      },
      { href: "/projects", label: "Projets", icon: "PR" },
    ],
  },
];

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

/**
 * @returns {typeof FALLBACK_NAV_GROUPS}
 */
export function getShellNavGroups() {
  if (typeof process === "undefined" || !process.env) {
    return FALLBACK_NAV_GROUPS;
  }
  const raw = process.env.NEXT_PUBLIC_SHELL_NAV_JSON;
  if (!raw || !String(raw).trim()) {
    return FALLBACK_NAV_GROUPS;
  }
  try {
    const parsed = JSON.parse(raw);
    const validated = validateNavGroups(parsed);
    return validated ?? FALLBACK_NAV_GROUPS;
  } catch {
    return FALLBACK_NAV_GROUPS;
  }
}
