"""Benchmarks automatiques de chargement des taches.

Mesure les performances des operations critiques :
- count_taches (comptage SQL)
- list_taches (requete paginee)
- endpoint GET /taches/ (serialisation Pydantic incluse)

Usage :
    cd backend
    pytest tests/test_benchmark_taches.py -v
"""

import os
import statistics
import time
from pathlib import Path

from fastapi.testclient import TestClient

TEST_DB_PATH = Path("data/test_benchmark.db")
os.environ["DATABASE_URL"] = f"sqlite:///./{TEST_DB_PATH.as_posix()}"
os.environ["WRITE_API_KEY"] = "bench-key"

from crud.tache import count_taches, list_taches  # noqa: E402
from database import Base, engine  # noqa: E402
from dependencies import get_db  # noqa: E402
from main import app  # noqa: E402
from models.tache import TacheModel  # noqa: E402

WRITE_HEADERS = {"X-API-Key": "bench-key"}
PROJECT_ID = "bench-project"
SEED_COUNT = 200
ITERATIONS = 20
# Seuils de performance (ms) — ajuster selon l'environnement
THRESHOLD_COUNT_MS = 50
THRESHOLD_LIST_MS = 100
THRESHOLD_ENDPOINT_MS = 200


def setup_module() -> None:
    TEST_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    Base.metadata.create_all(bind=engine)
    _seed_tasks()


def teardown_module() -> None:
    Base.metadata.drop_all(bind=engine)
    try:
        if TEST_DB_PATH.exists():
            TEST_DB_PATH.unlink()
    except PermissionError:
        pass  # Sous Windows, SQLite peut verrouiller le fichier


def _seed_tasks() -> None:
    """Insere SEED_COUNT taches pour les benchmarks."""
    db = next(get_db())
    try:
        for i in range(SEED_COUNT):
            etat = ["A faire", "En cours", "Terminee"][i % 3]
            section = ["backend", "frontend", "devops", "test"][i % 4]
            task = TacheModel(
                titre=f"Bench tache {i + 1}",
                description=f"Description de la tache benchmark numero {i + 1}",
                etat=etat,
                section=section,
                project_id=PROJECT_ID,
            )
            db.add(task)
        db.commit()
    finally:
        db.close()


def _measure(fn, iterations=ITERATIONS):
    """Execute fn plusieurs fois et retourne les statistiques en ms."""
    times = []
    for _ in range(iterations):
        start = time.perf_counter()
        fn()
        elapsed_ms = (time.perf_counter() - start) * 1000
        times.append(elapsed_ms)
    return {
        "min": min(times),
        "max": max(times),
        "mean": statistics.mean(times),
        "median": statistics.median(times),
        "p95": sorted(times)[int(len(times) * 0.95)],
        "stdev": statistics.stdev(times) if len(times) > 1 else 0,
    }


def _print_stats(label, stats):
    print(
        f"\n  {label} ({SEED_COUNT} taches, {ITERATIONS} iterations):\n"
        f"    min={stats['min']:.2f}ms  median={stats['median']:.2f}ms  "
        f"mean={stats['mean']:.2f}ms  p95={stats['p95']:.2f}ms  "
        f"max={stats['max']:.2f}ms  stdev={stats['stdev']:.2f}ms"
    )


# ---------- Benchmarks CRUD (acces direct DB) ----------


def test_bench_count_taches():
    """Benchmark : count_taches avec filtre project_id."""
    db = next(get_db())
    try:
        stats = _measure(lambda: count_taches(db, project_id=PROJECT_ID))
        _print_stats("count_taches", stats)
        assert (
            stats["p95"] < THRESHOLD_COUNT_MS
        ), f"count_taches p95 ({stats['p95']:.2f}ms) depasse le seuil de {THRESHOLD_COUNT_MS}ms"
    finally:
        db.close()


def test_bench_list_taches_page1():
    """Benchmark : list_taches page 1 (limit=100, offset=0)."""
    db = next(get_db())
    try:
        stats = _measure(lambda: list_taches(db, project_id=PROJECT_ID, limit=100, offset=0))
        _print_stats("list_taches (page 1, limit=100)", stats)
        assert (
            stats["p95"] < THRESHOLD_LIST_MS
        ), f"list_taches p95 ({stats['p95']:.2f}ms) depasse le seuil de {THRESHOLD_LIST_MS}ms"
    finally:
        db.close()


def test_bench_list_taches_full():
    """Benchmark : list_taches sans pagination (toutes les taches)."""
    db = next(get_db())
    try:
        stats = _measure(lambda: list_taches(db, project_id=PROJECT_ID, limit=500, offset=0))
        _print_stats("list_taches (full, limit=500)", stats)
        assert (
            stats["p95"] < THRESHOLD_LIST_MS
        ), f"list_taches full p95 ({stats['p95']:.2f}ms) depasse le seuil de {THRESHOLD_LIST_MS}ms"
    finally:
        db.close()


# ---------- Benchmarks endpoint HTTP ----------


def test_bench_endpoint_get_taches():
    """Benchmark : GET /taches/?project_id=... (serialisation Pydantic incluse)."""
    client = TestClient(app)

    def do_request():
        resp = client.get(f"/taches/?project_id={PROJECT_ID}&limit=100&offset=0")
        assert resp.status_code == 200

    stats = _measure(do_request)
    _print_stats("GET /taches/ (100 taches)", stats)
    assert (
        stats["p95"] < THRESHOLD_ENDPOINT_MS
    ), f"GET /taches/ p95 ({stats['p95']:.2f}ms) depasse le seuil de {THRESHOLD_ENDPOINT_MS}ms"


def test_bench_endpoint_get_taches_sort_desc():
    """Benchmark : GET /taches/ avec tri descendant."""
    client = TestClient(app)

    def do_request():
        resp = client.get(f"/taches/?project_id={PROJECT_ID}&limit=100&offset=0&sort=desc")
        assert resp.status_code == 200

    stats = _measure(do_request)
    _print_stats("GET /taches/ sort=desc (100 taches)", stats)
    assert (
        stats["p95"] < THRESHOLD_ENDPOINT_MS
    ), f"GET /taches/ desc p95 ({stats['p95']:.2f}ms) depasse le seuil de {THRESHOLD_ENDPOINT_MS}ms"


def test_bench_endpoint_full_payload():
    """Benchmark : GET /taches/ avec limit=500 (toutes les taches)."""
    client = TestClient(app)

    def do_request():
        resp = client.get(f"/taches/?project_id={PROJECT_ID}&limit=500&offset=0")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["taches"]) == SEED_COUNT

    stats = _measure(do_request)
    _print_stats("GET /taches/ (full payload, 200 taches)", stats)
    assert (
        stats["p95"] < THRESHOLD_ENDPOINT_MS * 2
    ), f"GET /taches/ full p95 ({stats['p95']:.2f}ms) depasse le seuil de {THRESHOLD_ENDPOINT_MS * 2}ms"
