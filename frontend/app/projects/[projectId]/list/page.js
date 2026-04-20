import { Suspense } from "react";
import HomeContent from "../../../components/home-content";

export default function ProjectListPage({ params }) {
  return (
    <Suspense fallback={<main className="travel-shell">Chargement...</main>}>
      <HomeContent initialProjectId={params?.projectId} view="list" />
    </Suspense>
  );
}
