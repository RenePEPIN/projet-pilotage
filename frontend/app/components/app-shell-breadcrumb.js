export const BREADCRUMB_SEGMENT_LABELS = {
  backlog: "Backlog",
  search: "Recherche",
  projects: "Projets",
  dashboard: "Tableau de bord",
  detail: "Detail",
  kanban: "Kanban",
  table: "Lignes",
  calendar: "Calendrier",
  list: "Liste",
};

export function toBreadcrumb(pathname) {
  if (!pathname || pathname === "/") {
    return [{ label: "Pilotage", href: "/projects" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  let current = "";

  const crumbs = segments.map((segment) => {
    current += `/${segment}`;
    const mapped = BREADCRUMB_SEGMENT_LABELS[segment];
    const label = mapped
      ? mapped
      : segment
          .replace(/-/g, " ")
          .replace(/^./, (value) => value.toUpperCase());
    return {
      label,
      href: current,
    };
  });

  return crumbs;
}
