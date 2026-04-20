import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { request } from "./api-client";

describe("api-client write-safe retry", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries GET on transient 5xx and succeeds", async () => {
    global.fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "temporary" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const payload = await request("/health/db", { method: "GET" });

    expect(payload).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry POST on transient network failure", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(
      request("/taches/", {
        method: "POST",
        body: JSON.stringify({ titre: "t" }),
      }),
    ).rejects.toThrow("Failed to fetch");

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry POST on transient 503", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "service unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      request("/taches/", {
        method: "POST",
        body: JSON.stringify({ titre: "t" }),
      }),
    ).rejects.toThrow("Serveur indisponible : service unavailable");

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("maps 503 without JSON detail to default French message", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response("", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(
      request("/taches/", {
        method: "POST",
        body: JSON.stringify({ titre: "x" }),
      }),
    ).rejects.toThrow(
      "Serveur indisponible : le backend ne repond pas ou le delai est depasse.",
    );
  });

  it("does not retry PUT on transient 502 and maps message in French", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response("Bad Gateway", { status: 502 }),
    );

    await expect(
      request("/taches/1", {
        method: "PUT",
        body: JSON.stringify({ titre: "updated" }),
      }),
    ).rejects.toThrow("Erreur passerelle (502) : Bad Gateway");

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("maps POST 500 with JSON detail in French", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Internal bug" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      request("/taches/", {
        method: "POST",
        body: JSON.stringify({ titre: "t" }),
      }),
    ).rejects.toThrow("Erreur serveur (500) : Internal bug");
  });

  it("maps POST 504 with JSON detail in French", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "upstream timeout" }), {
        status: 504,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      request("/taches/", {
        method: "POST",
        body: JSON.stringify({ titre: "t" }),
      }),
    ).rejects.toThrow("Delai depasse (504) : upstream timeout");
  });

  it("does not retry PATCH on transient 500", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    await expect(
      request("/taches/1", {
        method: "PATCH",
        body: JSON.stringify({ titre: "patched" }),
      }),
    ).rejects.toThrow();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry DELETE on transient network failure", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(request("/taches/1", { method: "DELETE" })).rejects.toThrow(
      "Failed to fetch",
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries GET on transient network TypeError", async () => {
    global.fetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const payload = await request("/health/db");

    expect(payload).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
