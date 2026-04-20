"use client";

import Link from "next/link";

/**
 * Boutons d’envoi et liens d’annulation du formulaire tâche.
 */

export function DetailFormActions({
  isModification,
  idTache,
  destinationUrl,
  isSubmitting,
  isLoadingTask,
}) {
  return (
    <div id="actions" className="action-row">
      {isModification ? (
        <>
          <button
            type="submit"
            id="lienModifier"
            className="primary-cta small ui-btn ui-btn-primary"
            disabled={isSubmitting || isLoadingTask}
          >
            Modifier
          </button>
          <Link
            href={`${destinationUrl}?annulerModifier=${idTache}`}
            id="lienAnnulerModification"
            className="action-link ui-btn ui-btn-secondary"
          >
            Annuler
          </Link>
        </>
      ) : (
        <>
          <button
            type="submit"
            id="lienAjouter"
            className="primary-cta small ui-btn ui-btn-primary"
            disabled={isSubmitting || isLoadingTask}
          >
            Ajouter
          </button>
          <Link
            href={`${destinationUrl}?annulerAjouter=1`}
            id="lienAnnulerAjouter"
            className="action-link ui-btn ui-btn-secondary"
          >
            Annuler
          </Link>
        </>
      )}
    </div>
  );
}
