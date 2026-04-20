import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTask,
  getAllTasksByProjectId,
  getTasks,
  getTasksByProjectId,
} from "./task-api";

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

  // QW-50: Test getAllTasksByProjectId pagination across multiple pages
  it("loads all tasks across multiple pages (QW-50)", async () => {
    // Mock first page (page 1/2 with truncated=true)
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          taches: [
            {
              id: 1,
              titre: "Task 1",
              description: "",
              etat: "A faire",
              section: "backend",
              project_id: "test-project",
              parent_task_id: null,
              due_date: null,
            },
          ],
          limit: 1,
          offset: 0,
          count: 2,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    // Mock second page (page 2/2 with truncated=false)
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          taches: [
            {
              id: 2,
              titre: "Task 2",
              description: "",
              etat: "En cours",
              section: "frontend",
              project_id: "test-project",
              parent_task_id: null,
              due_date: null,
            },
          ],
          limit: 1,
          offset: 1,
          count: 2,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const allTasks = await getAllTasksByProjectId("test-project");

    expect(allTasks).toHaveLength(2);
    expect(allTasks[0].titre).toBe("Task 1");
    expect(allTasks[1].titre).toBe("Task 2");
    // Verify two fetch calls were made (pagination)
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  // QW-51: Test error propagation through getAllTasksByProjectId
  it("propagates API error message from getAllTasksByProjectId (QW-51)", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Projet non trouve" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(getAllTasksByProjectId("invalid-project")).rejects.toThrow(
      "Projet non trouve",
    );
  });
});
