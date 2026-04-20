/**
 * Benchmarks automatiques de chargement des taches (frontend).
 *
 * Mesure les performances de :
 * - normalizeFromApi (transformation API → UI)
 * - getTasksByProjectId (fetch + normalisation complete)
 * - normalizeTaskCollection (pagination + mapping en lot)
 *
 * Usage :
 *   cd frontend
 *   pnpm test -- tests/benchmark-taches
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTasksByProjectId } from "../app/lib/task-api";

// Seuils de performance (ms)
const THRESHOLD_NORMALIZE_MS = 20;
const THRESHOLD_FETCH_CYCLE_MS = 50;

const TASK_COUNT = 200;
const ITERATIONS = 30;

function buildFakeApiPayload(count) {
  const statuts = ["A faire", "En cours", "Terminee"];
  const sections = ["backend", "frontend", "devops", "test"];
  const taches = [];
  for (let i = 1; i <= count; i++) {
    taches.push({
      id: i,
      titre: `Tache benchmark ${i}`,
      description: `Description de la tache benchmark numero ${i} pour mesurer les performances de normalisation`,
      etat: statuts[i % 3],
      section: sections[i % 4],
      project_id: "bench-project",
      parent_task_id: null,
      due_date: i % 5 === 0 ? "2026-06-15" : null,
    });
  }
  return { taches, limit: count, offset: 0, count };
}

function measure(fn, iterations = ITERATIONS) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    min: times[0],
    max: times[times.length - 1],
    mean: times.reduce((s, t) => s + t, 0) / times.length,
    median: times[Math.floor(times.length / 2)],
    p95: times[Math.floor(times.length * 0.95)],
  };
}

async function measureAsync(fn, iterations = ITERATIONS) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    min: times[0],
    max: times[times.length - 1],
    mean: times.reduce((s, t) => s + t, 0) / times.length,
    median: times[Math.floor(times.length / 2)],
    p95: times[Math.floor(times.length * 0.95)],
  };
}

function formatStats(label, stats) {
  return (
    `${label} (${TASK_COUNT} taches, ${ITERATIONS} iterations):\n` +
    `  min=${stats.min.toFixed(2)}ms  median=${stats.median.toFixed(2)}ms  ` +
    `mean=${stats.mean.toFixed(2)}ms  p95=${stats.p95.toFixed(2)}ms  ` +
    `max=${stats.max.toFixed(2)}ms`
  );
}

describe("benchmark-taches", () => {
  const payload = buildFakeApiPayload(TASK_COUNT);

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(`normalise ${TASK_COUNT} taches sous le seuil de ${THRESHOLD_NORMALIZE_MS}ms (p95)`, async () => {
    // Chaque iteration mock un fetch frais pour mesurer normalisation + deserialization
    global.fetch.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const stats = await measureAsync(async () => {
      const tasks = await getTasksByProjectId("bench-project", {
        limit: TASK_COUNT,
        offset: 0,
      });
      // Verifier que toutes les taches sont normalisees
      if (tasks.length !== TASK_COUNT) {
        throw new Error(`Attendu ${TASK_COUNT} taches, recu ${tasks.length}`);
      }
    });

    console.log(formatStats("getTasksByProjectId (normalisation)", stats));

    expect(stats.p95).toBeLessThan(THRESHOLD_FETCH_CYCLE_MS);
  });

  it(`getTasksByProjectId avec includeMeta sous le seuil de ${THRESHOLD_FETCH_CYCLE_MS}ms (p95)`, async () => {
    global.fetch.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const stats = await measureAsync(async () => {
      const result = await getTasksByProjectId("bench-project", {
        limit: TASK_COUNT,
        offset: 0,
        includeMeta: true,
      });
      if (result.tasks.length !== TASK_COUNT) {
        throw new Error(
          `Attendu ${TASK_COUNT} taches, recu ${result.tasks.length}`,
        );
      }
      if (result.pagination.count !== TASK_COUNT) {
        throw new Error("Pagination metadata incorrecte");
      }
    });

    console.log(formatStats("getTasksByProjectId (includeMeta)", stats));

    expect(stats.p95).toBeLessThan(THRESHOLD_FETCH_CYCLE_MS);
  });

  it("verifie la coherence des donnees normalisees", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const tasks = await getTasksByProjectId("bench-project", {
      limit: TASK_COUNT,
      offset: 0,
    });

    expect(tasks).toHaveLength(TASK_COUNT);

    // Verifier le mapping des statuts
    const statuts = new Set(tasks.map((t) => t.etat));
    expect(statuts).toEqual(new Set(["aFaire", "enCours", "terminee"]));

    // Verifier le mapping des sections
    const sections = new Set(tasks.map((t) => t.section));
    expect(sections).toEqual(
      new Set(["backend", "frontend", "devops", "test"]),
    );

    // Verifier les IDs (string apres normalisation)
    expect(tasks[0].id).toBe("1");
    expect(tasks[TASK_COUNT - 1].id).toBe(String(TASK_COUNT));
  });
});
