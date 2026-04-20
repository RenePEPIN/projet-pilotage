import { Suspense } from "react";
import ProjectsPageContent from "../components/projects-page-content";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<main className="travel-shell">Chargement...</main>}>
      <ProjectsPageContent />
    </Suspense>
  );
}
