"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VIEWS = [
  { segment: "dashboard", label: "Tableau de bord" },
  { segment: "kanban", label: "Kanban" },
  { segment: "table", label: "Lignes" },
  { segment: "calendar", label: "Calendrier" },
  { segment: "list", label: "Liste" },
];

const VIEW_SEGMENTS = new Set(VIEWS.map((v) => v.segment));

export default function ProjectViewTabs({ projectId }) {
  const pathname = usePathname() || "";
  const base = `/projects/${projectId}`;
  const pathSegments = pathname.split("/").filter(Boolean);
  const last = pathSegments[pathSegments.length - 1] || "";
  const activeSegment = VIEW_SEGMENTS.has(last) ? last : "dashboard";

  return (
    <nav className="project-view-tabs" aria-label="Mode de visualisation">
      {VIEWS.map(({ segment, label }) => {
        const href = `${base}/${segment}`;
        const isActive = activeSegment === segment;

        return (
          <Link
            key={segment}
            href={href}
            className={`project-view-tab${isActive ? " is-active" : ""}`}
            prefetch={true}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
