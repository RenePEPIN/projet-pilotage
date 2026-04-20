import { request } from "./api-client";

/**
 * Note stratégique globale (workspace unique côté API).
 * GET sans clé ; PUT via proxy avec X-API-Key serveur.
 */
export async function fetchStrategicNoteFromApi() {
  return request("/strategic-notes/");
}

export async function saveStrategicNoteToApi(content) {
  return request("/strategic-notes/", {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}
