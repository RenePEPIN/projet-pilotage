"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

const quickWinGuides = {
  "[Quick Win] Ajouter contraintes Pydantic": {
    objectif:
      "Securiser les entrees API en imposant des contraintes explicites sur chaque champ.",
    ou: "backend/schemas/tache.py et backend/schemas/project.py",
    backend: {
      ou: "Schemas Pydantic",
      objectif: "Bloquer les donnees invalides avant acces a la base.",
      etapes: [
        "Ajouter Field(min_length, max_length) sur titre, description, section et name.",
        "Ajouter une regex de slug sur project_id et id projet (a-z, 0-9, tiret).",
        "Verifier que les payloads invalides retournent bien 422.",
      ],
      commandes: ["cd backend", ".\\.venv\\Scripts\\python.exe -m pytest -q"],
    },
    frontend: {
      ou: "Formulaires detail/projets",
      objectif:
        "Envoyer des donnees deja propres pour reduire les erreurs utilisateur.",
      etapes: [
        "Conserver des valeurs simples et courtes dans les champs.",
        "Afficher les messages d'erreur API de validation de maniere claire.",
      ],
      commandes: ["cd frontend", "npx --yes pnpm build"],
    },
  },
  "[Quick Win] Retourner 409 sur projet duplique": {
    objectif: "Rendre la creation de projet explicite quand un id existe deja.",
    ou: "backend/crud/project.py et backend/main.py",
    backend: {
      ou: "CRUD + endpoint POST /projects",
      objectif: "Differencier creation reussie et conflit fonctionnel.",
      etapes: [
        "Retourner None dans le CRUD si l'id existe deja.",
        "Lever HTTP 409 dans l'endpoint createProject.",
        "Ajouter un test de non-regression pour le conflit.",
      ],
      commandes: ["cd backend", ".\\.venv\\Scripts\\python.exe -m pytest -q"],
    },
    frontend: {
      ou: "frontend/app/lib/project-api.js",
      objectif: "Permettre une UX claire en cas de doublon.",
      etapes: [
        "Intercepter 409 et afficher un message lisible a l'utilisateur.",
        "Proposer de renommer le projet en cas de conflit.",
      ],
      commandes: ["cd frontend", "npx --yes pnpm build"],
    },
  },
  "[Quick Win] Durcir configuration CORS": {
    objectif: "Reduire la surface d'attaque du backend.",
    ou: "backend/main.py (middleware CORS)",
    backend: {
      ou: "Configuration FastAPI CORS",
      objectif: "Autoriser uniquement ce qui est necessaire.",
      etapes: [
        "Remplacer les wildcards par une liste explicite de methodes.",
        "Restreindre les headers autorises au strict necessaire.",
        "Conserver uniquement les origins locales utiles au dev.",
      ],
      commandes: ["cd backend", ".\\.venv\\Scripts\\python.exe -m pytest -q"],
    },
    frontend: {
      ou: "Configuration d'appel API",
      objectif: "Garantir la compatibilite des appels legitimement autorises.",
      etapes: [
        "Verifier que les requetes envoient Content-Type conforme.",
        "Tester les routes critiques depuis l'UI apres changement CORS.",
      ],
      commandes: ["cd frontend", "npx --yes pnpm build"],
    },
  },
  "[Quick Win] Unifier contrat de reponse API": {
    objectif: "Avoir un format de liste unique sur tous les endpoints.",
    ou: "backend/main.py + frontend/app/lib/*.js",
    backend: {
      ou: "Endpoints /taches et /projects",
      objectif: "Supprimer les cas particuliers de parsing.",
      etapes: [
        "Choisir une convention unique (liste brute ou enveloppe).",
        "Adapter les response models et payloads backend.",
        "Mettre a jour les tests pour figer le contrat.",
      ],
      commandes: ["cd backend", ".\\.venv\\Scripts\\python.exe -m pytest -q"],
    },
    frontend: {
      ou: "task-api.js et project-api.js",
      objectif: "Simplifier la couche API et reduire la dette technique.",
      etapes: [
        "Adapter le parsing des reponses cote frontend.",
        "Supprimer le code de compatibilite devenu inutile.",
      ],
      commandes: ["cd frontend", "npx --yes pnpm build"],
    },
  },
  "[Quick Win] Ajouter pagination taches": {
    objectif:
      "Eviter le chargement complet des taches et preparer la montee en charge.",
    ou: "backend/crud/tache.py + backend/main.py + frontend task-api",
    backend: {
      ou: "Listage des taches",
      objectif: "Introduire limit/offset avec un tri stable.",
      etapes: [
        "Ajouter les parametres limit et offset dans l'endpoint.",
        "Appliquer le tri + la pagination dans le CRUD.",
        "Retourner count, limit et offset pour le frontend.",
      ],
      commandes: ["cd backend", ".\\.venv\\Scripts\\python.exe -m pytest -q"],
    },
    frontend: {
      ou: "HomeContent + task-api.js",
      objectif: "Permettre la navigation dans les pages de resultats.",
      etapes: [
        "Ajouter des controles pagination (suivant/precedent).",
        "Afficher le total et l'etat de page en cours.",
      ],
      commandes: ["cd frontend", "npx --yes pnpm build"],
    },
  },
};

function buildDefaultGuide(task) {
  const safeTitle = task?.titre || "Tache";
  const safeDescription = (
    task?.description || "Sans description detaillee."
  ).trim();
  const safeSection = (task?.section || "autre").toLowerCase();

  const backendSteps = [
    "Lire la tache et identifier le comportement attendu.",
    "Verifier les endpoints, schemas et validations impactes.",
    "Implementer la modification avec le plus petit changement possible.",
    "Executer les tests backend et controler les erreurs 4xx/5xx.",
  ];

  const frontendSteps = [
    "Reproduire le besoin dans l'interface avec des cas simples.",
    "Adapter le composant concerne et valider les etats loading/erreur.",
    "Verifier que l'UX reste lisible sur desktop et mobile.",
    "Compiler le frontend et verifier la non-regression visuelle.",
  ];

  if (safeSection === "backend") {
    frontendSteps.unshift(
      "Verifier l'impact eventuel sur les appels API depuis les ecrans existants.",
    );
  }

  if (safeSection === "frontend") {
    backendSteps.unshift(
      "Confirmer que le contrat API actuel couvre bien le besoin de l'ecran.",
    );
  }

  return {
    objectif: `Realiser la tache \"${safeTitle}\" de maniere fiable et verifiable.`,
    ou: `Categorie: ${task?.section || "autre"}`,
    backend: {
      ou: "backend/main.py, backend/crud/*, backend/schemas/*",
      objectif:
        "Garantir la coherence metier, les validations et la stabilite API.",
      etapes: backendSteps,
      commandes: ["cd backend", ".\\.venv\\Scripts\\python.exe -m pytest -q"],
    },
    frontend: {
      ou: "frontend/app/components/* et frontend/app/lib/*",
      objectif: "Livrer une interface claire, robuste et coherente avec l'API.",
      etapes: frontendSteps,
      commandes: ["cd frontend", "npx --yes pnpm build"],
    },
    details: safeDescription,
  };
}

export default function GuideModal({ tacheGuide }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const closeHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("guide");
    const nextQuery = params.toString();
    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        router.replace(closeHref);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeHref, router]);

  const quickGuide = quickWinGuides[tacheGuide?.titre];
  const guide =
    quickGuide || tacheGuide?.guide || buildDefaultGuide(tacheGuide);
  const backendGuide = guide?.backend ?? {
    ou: guide?.ou,
    objectif: guide?.objectif,
    etapes: guide?.etapes ?? [],
    commandes: guide?.commandes ?? [],
  };
  const frontendGuide = guide?.frontend ?? {
    ou: "Pas d'action frontend definie pour cette tache.",
    objectif: "Aucune action frontend obligatoire pour cette etape.",
    etapes: ["Verifier seulement l'impact sur les ecrans existants."],
    commandes: ["Aucune commande requise"],
  };

  return (
    <section
      id="guide-modal"
      className="guide-modal"
      aria-labelledby="guide-title"
    >
      <Link
        href={closeHref}
        className="guide-backdrop"
        aria-label="Fermer le guide"
      />
      <article
        className="guide-dialog"
        role="complementary"
        aria-labelledby="guide-title"
      >
        <div className="guide-head">
          <h3 id="guide-title">{tacheGuide.titre}</h3>
          <Link href={closeHref} className="action-link">
            Fermer
          </Link>
        </div>

        <p className="guide-objectif">
          <strong>Objectif general:</strong> {guide?.objectif}
        </p>
        <p className="guide-where">
          <strong>Contexte:</strong> {guide?.ou}
        </p>

        <p className="guide-where">
          <strong>Detail de la tache:</strong>{" "}
          {guide?.details || "Voir la description de la tache."}
        </p>

        <div className="guide-split">
          <section className="guide-block backend">
            <h4>Section Backend</h4>
            <p>
              <strong>Ou:</strong> {backendGuide.ou}
            </p>
            <p>
              <strong>Objectif:</strong> {backendGuide.objectif}
            </p>
            <h5>Etapes</h5>
            <ol>
              {backendGuide.etapes.map((etape) => (
                <li key={etape}>{etape}</li>
              ))}
            </ol>
            <h5>Commandes</h5>
            <div className="cmd-list">
              {backendGuide.commandes.map((commande, index) => (
                <pre key={`backend-cmd-${index}`}>
                  <code>{commande}</code>
                </pre>
              ))}
            </div>
          </section>

          <section className="guide-block frontend">
            <h4>Section Frontend</h4>
            <p>
              <strong>Ou:</strong> {frontendGuide.ou}
            </p>
            <p>
              <strong>Objectif:</strong> {frontendGuide.objectif}
            </p>
            <h5>Etapes</h5>
            <ol>
              {frontendGuide.etapes.map((etape, index) => (
                <li key={`frontend-step-${index}`}>{etape}</li>
              ))}
            </ol>
            <h5>Commandes</h5>
            <div className="cmd-list">
              {frontendGuide.commandes.map((commande, index) => (
                <pre key={`frontend-cmd-${index}`}>
                  <code>{commande}</code>
                </pre>
              ))}
            </div>
          </section>
        </div>
      </article>
    </section>
  );
}
