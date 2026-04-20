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
    ).rejects.toThrow();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry PUT on transient 502", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response("Bad Gateway", { status: 502 }),
    );

    await expect(
      request("/taches/1", {
        method: "PUT",
        body: JSON.stringify({ titre: "updated" }),
      }),
    ).rejects.toThrow();

    expect(global.fetch).toHaveBeenCalledTimes(1);
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
