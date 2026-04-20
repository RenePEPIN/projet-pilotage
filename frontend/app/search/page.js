import { Suspense } from "react";
import SearchPageContent from "../components/search-page-content";

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="travel-shell">Chargement...</main>}>
      <SearchPageContent />
    </Suspense>
  );
}
