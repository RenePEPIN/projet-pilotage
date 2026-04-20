import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createProject, getProjects } from "./project-api";

describe("project-api", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("supports enveloped projects payload", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          projects: [{ id: "p1", name: "Projet 1" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const projects = await getProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("p1");
  });

  it("maps 409 API errors to readable messages", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Projet deja existant" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(createProject("Projet API Principal")).rejects.toThrow(
      "Projet deja existant",
    );
  });
});
