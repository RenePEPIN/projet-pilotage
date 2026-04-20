export const DASHBOARD_API_PRINCIPAL =
  "/projects/projet-api-principal/dashboard";
export const DASHBOARD_POST_REUNION =
  "/projects/lis-taches-apres-reunion/dashboard";

/** Une seule entrée par projet : évite deux libellés pour la même URL (TB + API Principal). */
export const navGroups = [
  {
    title: "Workspace",
    items: [
      { href: "/backlog", label: "Backlog", icon: "BL" },
      { href: "/search", label: "Recherche", icon: "RQ" },
      { href: DASHBOARD_API_PRINCIPAL, label: "API Principal", icon: "AP" },
      { href: DASHBOARD_POST_REUNION, label: "Post Reunion", icon: "RE" },
      { href: "/projects", label: "Projets", icon: "PR" },
    ],
  },
];
