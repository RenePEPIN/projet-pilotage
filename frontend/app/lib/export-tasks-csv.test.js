import { describe, expect, it } from "vitest";
import { buildTasksCsv } from "./export-tasks-csv";

describe("buildTasksCsv", () => {
  it("inclut BOM et en-tetes", () => {
    const csv = buildTasksCsv(
      [
        {
          id: "1",
          titre: "Test",
          etat: "aFaire",
          section: "backend",
          projectId: "p1",
          dueDate: "",
        },
      ],
      new Map([["p1", "Projet A"]]),
    );
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("projet_nom");
    expect(csv).toContain("Projet A");
  });
});
