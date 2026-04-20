import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST, PUT } from "./route";

describe("write proxy Content-Type validation", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
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
