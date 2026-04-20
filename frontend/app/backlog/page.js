import { Suspense } from "react";
import BacklogContent from "../components/backlog-content";

export default function BacklogPage() {
  return (
    <Suspense fallback={<main className="travel-shell">Chargement...</main>}>
      <BacklogContent />
    </Suspense>
  );
}
