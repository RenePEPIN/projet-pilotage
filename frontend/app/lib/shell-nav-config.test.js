import { describe, expect, it } from "vitest";

import {
  buildDefaultShellNavFromProjects,
  projectItemsForShellNav,
  shellNavIconFromLabel,
  shellNavItemIsActive,
} from "./shell-nav-config";

describe("shellNavIconFromLabel", () => {
  it("returns two uppercase chars from name", () => {
    expect(shellNavIconFromLabel("Alpha Beta")).toBe("AL");
  });

  it("returns PJ when empty", () => {
    expect(shellNavIconFromLabel("")).toBe("PJ");
  });
});

describe("projectItemsForShellNav", () => {
  it("builds dashboard hrefs with encoded ids", () => {
    const items = projectItemsForShellNav([
      { id: "mon-projet", name: "Mon Projet" },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].href).toBe("/projects/mon-projet/dashboard");
    expect(items[0].label).toBe("Mon Projet");
  });
});

describe("buildDefaultShellNavFromProjects", () => {
  it("sépare Navigation et Projets en deux groupes", () => {
    const groups = buildDefaultShellNavFromProjects([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].title).toBe("Navigation");
    expect(groups[0].items.map((i) => i.href)).toEqual(["/backlog", "/search"]);
    expect(groups[1].title).toBe("Projets");
    const projItems = groups[1].items.map((i) => i.href);
    expect(projItems[0]).toBe("/projects/a/dashboard");
    expect(projItems[1]).toBe("/projects/b/dashboard");
    expect(projItems[projItems.length - 1]).toBe("/projects");
  });
});

describe("shellNavItemIsActive", () => {
  it("active backlog subpaths", () => {
    expect(shellNavItemIsActive("/backlog/foo", "/backlog")).toBe(true);
  });

  it("active tout sous /projects/:id pour un lien dashboard projet", () => {
    expect(
      shellNavItemIsActive("/projects/p1/kanban", "/projects/p1/dashboard"),
    ).toBe(true);
  });

  it("inactive autre projet", () => {
    expect(
      shellNavItemIsActive("/projects/p2/kanban", "/projects/p1/dashboard"),
    ).toBe(false);
  });
});
