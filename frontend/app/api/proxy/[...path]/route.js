import { NextResponse } from "next/server";

const BACKEND_URL = process.env.API_BASE_URL || "http://127.0.0.1:8001";

const WRITE_API_KEY = process.env.WRITE_API_KEY || "";

// Timeout en millisecondes avant d'abandonner la requête vers le backend.
const PROXY_TIMEOUT_MS = 10_000;
const SAFE_PATH_SEGMENT_RE = /^[A-Za-z0-9_-]+$/;
const ALLOWED_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
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

async function handler(request, { params }) {
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

  const path = "/" + pathSegments.join("/");
  const searchParams = getSearchParamsString(request);
  const url = `${BACKEND_URL}${path}${searchParams ? "?" + searchParams : ""}`;

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": WRITE_API_KEY,
  };

  const init = {
    method: request.method,
    headers,
    signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

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

  // NextResponse ne supporte pas le status 204 (No Content) — on retourne
  // un 204 vide pour les réponses sans corps (ex: DELETE).
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

export { handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
