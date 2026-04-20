import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST, PUT } from "./route";

describe("write proxy Content-Type validation", () => {
  beforeEach(() => {
    process.env.WRITE_API_KEY = "test-proxy-key";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    delete process.env.WRITE_API_KEY;
    vi.restoreAllMocks();
  });

  it("returns 415 when POST Content-Type is not JSON", async () => {
    const request = new Request("http://localhost/api/proxy/taches", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not-json",
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ["taches"] }),
    });

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      detail: "Content-Type doit etre application/json.",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("accepts JSON Content-Type with charset and forwards request", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 123 }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const request = new Request("http://localhost/api/proxy/taches", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ titre: "Nouvelle tache" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ["taches"] }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 123 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8001/taches",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("returns 405 when method is not allowed on the write proxy", async () => {
    const request = new Request("http://localhost/api/proxy/taches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre: "ignore" }),
    });

    Object.defineProperty(request, "method", {
      value: "GET",
      configurable: true,
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ["taches"] }),
    });

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST, PUT, PATCH, DELETE");
    await expect(response.json()).resolves.toEqual({
      detail: "Methode non autorisee sur le proxy d'ecriture.",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("forwards GET to the backend and returns JSON", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ projects: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const request = new Request("http://localhost/api/proxy/projects?limit=1", {
      method: "GET",
    });

    const response = await GET(request, {
      params: Promise.resolve({ path: ["projects"] }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ projects: [] });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8001/projects?limit=1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns 503 when WRITE_API_KEY is empty", async () => {
    delete process.env.WRITE_API_KEY;

    const request = new Request("http://localhost/api/proxy/taches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre: "x" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ["taches"] }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      detail:
        "Configuration serveur : WRITE_API_KEY manquant ou vide pour le proxy d'ecriture. Definir la variable d'environnement sur l'instance Next.",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 400 when a proxy path segment is invalid", async () => {
    const request = new Request("http://localhost/api/proxy/taches/..", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre: "ignore" }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ path: ["taches", ".."] }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      detail: "Chemin proxy invalide.",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
