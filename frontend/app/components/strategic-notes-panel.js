"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  fetchStrategicNoteFromApi,
  saveStrategicNoteToApi,
} from "../lib/strategic-notes-api";
import {
  formatStrategicNoteUpdatedAt,
  readNotesFromStorage,
  writeNotesToStorage,
} from "../lib/strategic-notes-local";

/**
 * Panneau latéral : notes stratégiques — API (workspace global) + copie locale en secours.
 */
export default function StrategicNotesPanel({ open, onClose }) {
  const titleId = useId();
  const textareaRef = useRef(null);
  const skipNextPersistRef = useRef(true);
  const [text, setText] = useState("");
  const [warning, setWarning] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverUpdatedAt, setServerUpdatedAt] = useState(null);

  const persistRemote = useCallback(async (value) => {
    writeNotesToStorage(value);
    try {
      const data = await saveStrategicNoteToApi(value);
      setServerUpdatedAt(data?.updated_at ?? null);
      setWarning("");
    } catch {
      setWarning(
        "API inaccessible : texte conserve localement sur ce navigateur.",
      );
    }
  }, []);

  const flushAndClose = useCallback(async () => {
    await persistRemote(text);
    onClose();
  }, [text, onClose, persistRemote]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    let cancelled = false;
    setIsLoading(true);
    setWarning("");

    (async () => {
      skipNextPersistRef.current = true;
      try {
        const data = await fetchStrategicNoteFromApi();
        if (cancelled) {
          return;
        }
        setText(data?.content ?? "");
        setServerUpdatedAt(data?.updated_at ?? null);
        writeNotesToStorage(data?.content ?? "");
      } catch {
        if (!cancelled) {
          setText(readNotesFromStorage());
          setServerUpdatedAt(null);
          setWarning(
            "Lecture API indisponible : affichage du brouillon local.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          window.setTimeout(() => textareaRef.current?.focus(), 80);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || isLoading) {
      return undefined;
    }
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return undefined;
    }
    const t = window.setTimeout(() => {
      persistRemote(text);
    }, 500);
    return () => window.clearTimeout(t);
  }, [text, open, isLoading, persistRemote]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        flushAndClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, flushAndClose]);

  if (!open) {
    return null;
  }

  const updatedLabel = formatStrategicNoteUpdatedAt(serverUpdatedAt);

  return (
    <div className="strategic-notes-layer">
      <button
        type="button"
        className="strategic-notes-backdrop"
        aria-label="Fermer les notes strategiques"
        onClick={() => flushAndClose()}
      />
      <div
        id="strategic-notes-panel"
        className="strategic-notes-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="strategic-notes-head">
          <div>
            <h2 id={titleId} className="strategic-notes-title">
              Notes strategiques
            </h2>
            <p className="strategic-notes-sub">
              Workspace partage <strong>global</strong> (une note pour
              l&apos;equipe via l&apos;API) ; copie locale en secours.
            </p>
            {updatedLabel ? (
              <p className="strategic-notes-meta" aria-live="polite">
                Derniere maj serveur : {updatedLabel}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="strategic-notes-close shell-icon-btn"
            onClick={() => flushAndClose()}
            aria-label="Fermer"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {warning ? (
          <p className="strategic-notes-warning info-banner" role="status">
            {warning}
          </p>
        ) : null}
        {isLoading ? (
          <p className="info-banner" role="status">
            Chargement...
          </p>
        ) : null}
        <textarea
          ref={textareaRef}
          className="strategic-notes-textarea ui-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex. focus Q2, dette technique API, ne pas oublier..."
          spellCheck="true"
          rows={16}
          disabled={isLoading}
        />
        <p className="strategic-notes-foot">
          Sauvegarde automatique (serveur + memoire locale). Mutations via proxy
          Next (cle API serveur).
        </p>
      </div>
    </div>
  );
}
