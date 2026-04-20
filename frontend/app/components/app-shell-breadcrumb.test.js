import { describe, expect, it } from "vitest";
import { toBreadcrumb } from "./app-shell-breadcrumb";

describe("toBreadcrumb", () => {
  it("returns Pilotage for root", () => {
    expect(toBreadcrumb("/")).toEqual([
      { label: "Pilotage", href: "/projects" },
    ]);
  });

  it("maps known segments and builds hrefs", () => {
    const crumbs = toBreadcrumb("/projects/foo/dashboard");
    expect(crumbs[0].label).toBe("Projets");
    expect(crumbs[0].href).toBe("/projects");
    expect(crumbs[1].label).toBe("Foo");
    expect(crumbs[2].label).toBe("Tableau de bord");
    expect(crumbs[2].href).toBe("/projects/foo/dashboard");
  });
});
