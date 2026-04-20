const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001";

// Les routes d'écriture transitent par le proxy Next.js afin que la clé
// WRITE_API_KEY reste confidentielle (jamais exposée au navigateur).
const WRITE_PROXY_URL = "/api/proxy";

const MAX_RETRIES = 3;
const RETRYABLE_METHODS = new Set(["GET", "HEAD"]);

function isRetryable(error, status) {
  if (error instanceof TypeError) return true; // network error
  if (status >= 500 && status !== 501) return true;
  return false;
}

async function fetchWithRetry(url, fetchOptions, maxRetries) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt - 1) * 100),
      );
    }
    try {
      const response = await fetch(url, fetchOptions);
      if (
        attempt < maxRetries &&
        !response.ok &&
        isRetryable(null, response.status)
      ) {
        lastError = new Error(`HTTP ${response.status}`);
        lastError.status = response.status;
        continue;
      }
      return response;
    } catch (err) {
      lastError = err;
      if (!isRetryable(err, null)) throw err;
    }
  }
  throw lastError;
}

export async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const maxRetries = RETRYABLE_METHODS.has(method) ? MAX_RETRIES : 0;
  const isWrite = method !== "GET" && method !== "HEAD";
  const baseUrl = isWrite ? WRITE_PROXY_URL : API_BASE_URL;

  const response = await fetchWithRetry(
    `${baseUrl}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      cache: "no-store",
    },
    maxRetries,
  );

  if (!response.ok) {
    const errorText = await response.text();
    let detail = errorText;

    try {
      const parsed = JSON.parse(errorText);
      if (parsed && typeof parsed.detail === "string") {
        detail = parsed.detail;
      }
    } catch {
      // Keep raw text when body is not JSON
    }

    if (response.status === 401) {
      throw new Error("Acces refuse: cle API invalide ou manquante.");
    }
    if (response.status === 409) {
      throw new Error(detail || "Conflit detecte: la ressource existe deja.");
    }
    if (response.status === 422) {
      throw new Error(
        detail
          ? `Donnees invalides: ${detail}`
          : "Donnees invalides: verifie les champs saisis.",
      );
    }

    throw new Error(detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
