// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/project-api", () => ({
  getProjects: vi.fn(),
  getDefaultProjects: vi.fn(),
}));

import { getDefaultProjects, getProjects } from "../lib/project-api";
import { useProjects } from "./use-projects";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function flushMicrotasks() {
  return Promise.resolve();
}

describe("useProjects", () => {
  let container;
  let root;
  let latestState;

  function HookProbe(props) {
    latestState = useProjects(props);
    return null;
  }

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    latestState = undefined;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("replaces stale projects with an empty list when API and defaults are empty", async () => {
    getProjects.mockResolvedValueOnce([{ id: "p1", name: "Projet 1" }]);

    await act(async () => {
      root.render(React.createElement(HookProbe));
      await flushMicrotasks();
    });

    expect(latestState.projects).toEqual([{ id: "p1", name: "Projet 1" }]);

    getProjects.mockResolvedValueOnce([]);
    getDefaultProjects.mockResolvedValueOnce([]);

    await act(async () => {
      await latestState.refreshProjects();
      await flushMicrotasks();
    });

    expect(latestState.projects).toEqual([]);
  });

  it("keeps default-project fallback behavior when main API list is empty", async () => {
    getProjects.mockResolvedValueOnce([]);
    getDefaultProjects.mockResolvedValueOnce([
      { id: "projet-api-principal", name: "Projet API Principal" },
    ]);

    await act(async () => {
      root.render(
        React.createElement(HookProbe, {
          decorateProject: (project) => ({ ...project, createdAt: "API" }),
        }),
      );
      await flushMicrotasks();
    });

    expect(latestState.projects).toEqual([
      {
        id: "projet-api-principal",
        name: "Projet API Principal",
        createdAt: "API",
      },
    ]);
  });
});
