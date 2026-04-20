import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTask, getTasks, getTasksByProjectId } from "./task-api";

describe("task-api", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns tasks from enveloped payload and passes pagination params", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          taches: [
            {
              id: 1,
              titre: "T1",
              description: "",
              etat: "A faire",
              section: "backend",
              project_id: "projet-api-principal",
              parent_task_id: null,
              due_date: null,
            },
          ],
          limit: 2,
          offset: 0,
          count: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const tasks = await getTasksByProjectId("projet-api-principal", {
      limit: 2,
      offset: 0,
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].etat).toBe("aFaire");
    expect(String(global.fetch.mock.calls[0][0])).toContain("limit=2");
    expect(String(global.fetch.mock.calls[0][0])).toContain("offset=0");
  });

  it("maps 422 API errors to readable messages", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Tache parente introuvable" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      createTask(
        {
          titre: "T2",
          description: "",
          etat: "aFaire",
          dueDate: "",
          parentTaskId: 999,
        },
        { section: "backend", projectId: "projet-api-principal" },
      ),
    ).rejects.toThrow("Donnees invalides: Tache parente introuvable");
  });

  it("returns pagination metadata when includeMeta is true", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          taches: [
            {
              id: 1,
              titre: "T1",
              description: "",
              etat: "A faire",
              section: "backend",
              project_id: "projet-api-principal",
              parent_task_id: null,
              due_date: null,
            },
          ],
          limit: 100,
          offset: 0,
          count: 250,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getTasksByProjectId("projet-api-principal", {
      includeMeta: true,
    });

    expect(result.tasks).toHaveLength(1);
    expect(result.pagination).toEqual({
      limit: 100,
      offset: 0,
      count: 250,
      truncated: true,
    });
  });

  it("keeps array return by default for backward compatibility", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          taches: [
            {
              id: 2,
              titre: "T2",
              description: "",
              etat: "En cours",
              section: "frontend",
              project_id: "projet-api-principal",
              parent_task_id: null,
              due_date: null,
            },
          ],
          limit: 100,
          offset: 0,
          count: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const tasks = await getTasks();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks[0].etat).toBe("enCours");
  });
});
