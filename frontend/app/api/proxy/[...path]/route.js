import { NextResponse } from "next/server";

const BACKEND_URL = process.env.API_BASE_URL || "http://127.0.0.1:8001";

/** Lu à l’exécution (tests / env peuvent changer entre les imports et le handler). */
function getWriteApiKey() {
  return process.env.WRITE_API_KEY || "";
}

let missingWriteKeyLogged = false;

// Timeout en millisecondes avant d'abandonner la requête vers le backend.
const PROXY_TIMEOUT_MS = 10_000;
const SAFE_PATH_SEGMENT_RE = /^[A-Za-z0-9_-]+$/;
const ALLOWED_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ALLOWED_READ_METHODS = new Set(["GET", "HEAD"]);
const JSON_CONTENT_TYPE_RE = /^application\/json(?:\s*;.*)?$/i;

function sanitizePathSegments(rawSegments) {
  if (!Array.isArray(rawSegments) || rawSegments.length === 0) {
    return null;
  }

  if (!rawSegments.every((segment) => SAFE_PATH_SEGMENT_RE.test(segment))) {
    return null;
  }

  return rawSegments;
}

function requiresJsonContentType(method) {
  return method === "POST" || method === "PUT" || method === "PATCH";
}

function hasJsonContentType(contentTypeHeader) {
  if (typeof contentTypeHeader !== "string") {
    return false;
  }
  return JSON_CONTENT_TYPE_RE.test(contentTypeHeader.trim());
}

function getSearchParamsString(request) {
  const nextUrlSearchParams = request.nextUrl?.searchParams;
  if (
    nextUrlSearchParams &&
    typeof nextUrlSearchParams.toString === "function"
  ) {
    return nextUrlSearchParams.toString();
  }

  try {
    return new URL(request.url).searchParams.toString();
  } catch {
    return "";
  }
}

/**
 * Appelle le backend et renvoie une NextResponse (corps texte, status, Content-Type).
 * Gère timeout / erreur réseau → 503 JSON.
 */
async function forwardToBackend(request, pathSegments, fetchOptions) {
  const path = "/" + pathSegments.join("/");
  const searchParams = getSearchParamsString(request);
  const url = `${BACKEND_URL}${path}${searchParams ? "?" + searchParams : ""}`;

  const init = {
    ...fetchOptions,
    signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
  };

  let backendResponse;
  try {
    backendResponse = await fetch(url, init);
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    return new NextResponse(
      JSON.stringify({
        detail: isTimeout
          ? "Le backend n'a pas répondu dans le délai imparti."
          : "Impossible de joindre le backend.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const body = await backendResponse.text();

  return new NextResponse(body, {
    status: backendResponse.status,
    headers: {
      "Content-Type":
        backendResponse.headers.get("Content-Type") || "application/json",
    },
  });
}

async function readHandler(request, { params }) {
  if (!ALLOWED_READ_METHODS.has(request.method)) {
    return new NextResponse(
      JSON.stringify({
        detail: "Methode non autorisee sur le proxy de lecture.",
      }),
      {
        status: 405,
        headers: {
          Allow: "GET, HEAD",
          "Content-Type": "application/json",
        },
      },
    );
  }

  const pathSegments = sanitizePathSegments((await params).path);
  if (!pathSegments) {
    return new NextResponse(
      JSON.stringify({ detail: "Chemin proxy invalide." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return forwardToBackend(request, pathSegments, {
    method: request.method,
  });
}

async function handler(request, { params }) {
  const writeKey = getWriteApiKey();
  if (!String(writeKey).trim()) {
    if (!missingWriteKeyLogged) {
      missingWriteKeyLogged = true;
      console.error(
        "[proxy/ecriture] WRITE_API_KEY absent ou vide : mutations via /api/proxy/* bloquees (sinon 401 opaque cote backend). Definir WRITE_API_KEY sur l'instance Next.",
      );
    }
    return new NextResponse(
      JSON.stringify({
        detail:
          "Configuration serveur : WRITE_API_KEY manquant ou vide pour le proxy d'ecriture. Definir la variable d'environnement sur l'instance Next.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!ALLOWED_WRITE_METHODS.has(request.method)) {
    return new NextResponse(
      JSON.stringify({
        detail: "Methode non autorisee sur le proxy d'ecriture.",
      }),
      {
        status: 405,
        headers: {
          Allow: "POST, PUT, PATCH, DELETE",
          "Content-Type": "application/json",
        },
      },
    );
  }

  if (requiresJsonContentType(request.method)) {
    const contentType = request.headers.get("content-type");
    if (!hasJsonContentType(contentType)) {
      return new NextResponse(
        JSON.stringify({ detail: "Content-Type doit etre application/json." }),
        {
          status: 415,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  const pathSegments = sanitizePathSegments((await params).path);
  if (!pathSegments) {
    return new NextResponse(
      JSON.stringify({ detail: "Chemin proxy invalide." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": writeKey,
  };

  const init = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  return forwardToBackend(request, pathSegments, init);
}

export {
  readHandler as GET,
  readHandler as HEAD,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
