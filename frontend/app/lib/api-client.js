// Lectures et écritures via le proxy Next (same-origin). La clé WRITE_API_KEY
// reste côté serveur pour les mutations.
const BROWSER_API_PROXY = "/api/proxy";

const MAX_RETRIES = 3;
const RETRYABLE_METHODS = new Set(["GET", "HEAD"]);

function isRetryable(error, status) {
  if (error instanceof TypeError) return true; // erreur réseau
  if (status >= 500 && status !== 501) return true;
  return false;
}

/**
 * FastAPI : `detail` peut être une chaîne ou une liste d’objets de validation
 * `{ loc, msg, type }`.
 */
function extractReadableDetail(parsed, fallbackText) {
  if (!parsed || typeof parsed !== "object" || !("detail" in parsed)) {
    return fallbackText;
  }
  const d = parsed.detail;
  if (typeof d === "string") {
    return d;
  }
  if (Array.isArray(d)) {
    const parts = [];
    for (const item of d) {
      if (item && typeof item === "object" && typeof item.msg === "string") {
        const loc = Array.isArray(item.loc)
          ? item.loc.filter(Boolean).join(".")
          : "";
        parts.push(loc ? `${loc}: ${item.msg}` : item.msg);
      } else if (typeof item === "string") {
        parts.push(item);
      }
    }
    if (parts.length > 0) {
      return parts.join(" ; ");
    }
  }
  return fallbackText;
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
  const baseUrl = BROWSER_API_PROXY;

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
      detail = extractReadableDetail(parsed, errorText);
    } catch {
      /* corps non JSON : conserver le texte brut */
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

    if (response.status === 500) {
      const defaut = "Erreur serveur : une erreur interne s'est produite.";
      const corps =
        detail && String(detail).trim() ? String(detail).trim() : "";
      throw new Error(corps ? `Erreur serveur (500) : ${corps}` : defaut);
    }

    // 502 / 503 / 504 : erreurs passerelle ou disponibilité (souvent proxy ↔ backend).
    if (response.status === 502) {
      const defaut =
        "Passerelle incorrecte : le service en amont ne repond pas.";
      const corps =
        detail && String(detail).trim() ? String(detail).trim() : "";
      throw new Error(corps ? `Erreur passerelle (502) : ${corps}` : defaut);
    }
    if (response.status === 503) {
      const defaut =
        "Serveur indisponible : le backend ne repond pas ou le delai est depasse.";
      const corps =
        detail && String(detail).trim() ? String(detail).trim() : "";
      throw new Error(corps ? `Serveur indisponible : ${corps}` : defaut);
    }
    if (response.status === 504) {
      const defaut = "Delai depasse : le serveur n'a pas repondu a temps.";
      const corps =
        detail && String(detail).trim() ? String(detail).trim() : "";
      throw new Error(corps ? `Delai depasse (504) : ${corps}` : defaut);
    }

    throw new Error(detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
