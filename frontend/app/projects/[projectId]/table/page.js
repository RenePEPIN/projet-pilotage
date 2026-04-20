import { Suspense } from "react";
import HomeContent from "../../../components/home-content";

export default function ProjectTablePage({ params }) {
  return (
    <Suspense fallback={<main className="travel-shell">Chargement...</main>}>
      <HomeContent initialProjectId={params?.projectId} view="table" />
    </Suspense>
  );
}
