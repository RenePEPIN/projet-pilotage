"""Tests d'integration du flux complet parent-enfant.

Couvre les scenarios de bout en bout manquants :
- Hierarchie multi-niveaux (3+ profondeur)
- Reparentagage vers un parent valide
- Rejet cross-projet a la mise a jour
- Suppression d'un parent intermediaire (cascade SET NULL)
- IDs parents invalides (0, negatif)
- Lecture GET avec parent_task_id correct a chaque niveau

Usage :
    cd backend
    pytest tests/test_integration_parent_enfant.py -v
"""

import os
from pathlib import Path

TEST_DB_PATH = Path("data/test_integration_parent.db")
os.environ["DATABASE_URL"] = f"sqlite:///./{TEST_DB_PATH.as_posix()}"
os.environ["WRITE_API_KEY"] = "test-write-key"

from fastapi.testclient import TestClient  # noqa: E402

from core.rate_limit import limiter  # noqa: E402
from database import Base, engine  # noqa: E402
from main import app  # noqa: E402

WRITE_HEADERS = {"X-API-Key": "test-write-key"}
PROJECT = "integration-test"


def reset_database() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    limiter.reset()


def setup_module() -> None:
    TEST_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    Base.metadata.create_all(bind=engine)


def teardown_module() -> None:
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    try:
        if TEST_DB_PATH.exists():
            TEST_DB_PATH.unlink()
    except PermissionError:
        pass


def _create_task(client, titre, parent_id=None, project_id=PROJECT):
    """Helper : cree une tache et retourne son id."""
    payload = {
        "titre": titre,
        "description": f"Test {titre}",
        "etat": "A faire",
        "section": "backend",
        "project_id": project_id,
        "parent_task_id": parent_id,
    }
    resp = client.post("/taches/", json=payload, headers=WRITE_HEADERS)
    assert resp.status_code in (200, 201), f"Creation echouee: {resp.text}"
    return resp.json()["id"]


def _get_task(client, task_id):
    """Helper : recupere une tache par id."""
    resp = client.get(f"/taches/{task_id}")
    assert resp.status_code == 200
    return resp.json()


def _update_task(client, task_id, updates):
    """Helper : met a jour une tache et retourne la reponse."""
    return client.put(f"/taches/{task_id}", json=updates, headers=WRITE_HEADERS)


# ---------- Hierarchie multi-niveaux ----------


def test_create_3_level_hierarchy():
    """Cree grand-parent → parent → enfant et verifie les liens."""
    reset_database()
    with TestClient(app) as client:
        gp_id = _create_task(client, "Grand-parent")
        p_id = _create_task(client, "Parent", parent_id=gp_id)
        c_id = _create_task(client, "Enfant", parent_id=p_id)

        gp = _get_task(client, gp_id)
        p = _get_task(client, p_id)
        c = _get_task(client, c_id)

        assert gp["parent_task_id"] is None
        assert p["parent_task_id"] == gp_id
        assert c["parent_task_id"] == p_id


def test_create_5_level_deep_chain():
    """Cree une chaine de 5 niveaux et verifie chaque lien via GET."""
    reset_database()
    with TestClient(app) as client:
        ids = []
        for i in range(5):
            parent = ids[-1] if ids else None
            task_id = _create_task(client, f"Niveau-{i + 1}", parent_id=parent)
            ids.append(task_id)

        for i, task_id in enumerate(ids):
            task = _get_task(client, task_id)
            expected_parent = ids[i - 1] if i > 0 else None
            assert task["parent_task_id"] == expected_parent, (
                f"Niveau {i + 1}: parent attendu {expected_parent}, "
                f"recu {task['parent_task_id']}"
            )


# ---------- Reparentagage ----------


def test_reparent_to_different_valid_parent():
    """Deplace un enfant d'un parent a un autre dans le meme projet."""
    reset_database()
    with TestClient(app) as client:
        parent_a = _create_task(client, "Parent A")
        parent_b = _create_task(client, "Parent B")
        child = _create_task(client, "Enfant", parent_id=parent_a)

        # Verifier attachement initial
        task = _get_task(client, child)
        assert task["parent_task_id"] == parent_a

        # Reparenter vers B
        resp = _update_task(client, child, {"parent_task_id": parent_b})
        assert resp.status_code == 200

        task = _get_task(client, child)
        assert task["parent_task_id"] == parent_b


def test_detach_from_parent_via_null():
    """Detache un enfant en passant parent_task_id a null."""
    reset_database()
    with TestClient(app) as client:
        parent = _create_task(client, "Parent")
        child = _create_task(client, "Enfant", parent_id=parent)

        resp = _update_task(client, child, {"parent_task_id": None})
        assert resp.status_code == 200

        task = _get_task(client, child)
        assert task["parent_task_id"] is None


# ---------- Suppression cascade ----------


def test_delete_mid_chain_parent_nullifies_child():
    """Grand-parent → Parent → Enfant : supprimer Parent met l'enfant a null."""
    reset_database()
    with TestClient(app) as client:
        gp_id = _create_task(client, "Grand-parent")
        p_id = _create_task(client, "Parent", parent_id=gp_id)
        c_id = _create_task(client, "Enfant", parent_id=p_id)

        # Supprimer le parent intermediaire
        resp = client.delete(f"/taches/{p_id}", headers=WRITE_HEADERS)
        assert resp.status_code == 204

        # L'enfant doit avoir parent_task_id = null
        child = _get_task(client, c_id)
        assert child["parent_task_id"] is None

        # Le grand-parent doit survivre intact
        gp = _get_task(client, gp_id)
        assert gp["parent_task_id"] is None
        assert gp["titre"] == "Grand-parent"


def test_delete_leaf_keeps_parent_intact():
    """Supprimer un enfant ne touche pas le parent."""
    reset_database()
    with TestClient(app) as client:
        parent = _create_task(client, "Parent")
        child = _create_task(client, "Enfant", parent_id=parent)

        resp = client.delete(f"/taches/{child}", headers=WRITE_HEADERS)
        assert resp.status_code == 204

        p = _get_task(client, parent)
        assert p["titre"] == "Parent"
        assert p["parent_task_id"] is None


def test_delete_root_nullifies_all_children():
    """Supprimer la racine d'un arbre met tous les enfants directs a null."""
    reset_database()
    with TestClient(app) as client:
        root = _create_task(client, "Racine")
        c1 = _create_task(client, "Enfant-1", parent_id=root)
        c2 = _create_task(client, "Enfant-2", parent_id=root)
        c3 = _create_task(client, "Enfant-3", parent_id=root)

        resp = client.delete(f"/taches/{root}", headers=WRITE_HEADERS)
        assert resp.status_code == 204

        for child_id in [c1, c2, c3]:
            child = _get_task(client, child_id)
            assert child["parent_task_id"] is None


# ---------- Rejets de validation ----------


def test_reject_cross_project_parent_on_update():
    """Rejette le reparentagage vers un parent d'un autre projet."""
    reset_database()
    with TestClient(app) as client:
        other = _create_task(client, "Autre projet", project_id="autre-projet")
        child = _create_task(client, "Enfant")

        resp = _update_task(client, child, {"parent_task_id": other})
        assert resp.status_code == 422


def test_reject_cycle_on_reparent():
    """Detecte un cycle cree par un reparentagage : A→B→C, puis C.parent=A, puis A.parent=C."""
    reset_database()
    with TestClient(app) as client:
        a = _create_task(client, "A")
        b = _create_task(client, "B", parent_id=a)
        c = _create_task(client, "C", parent_id=b)

        # Tenter de faire A le parent de C -> cycle A→B→C→A
        resp = _update_task(client, a, {"parent_task_id": c})
        assert resp.status_code == 422


def test_reject_parent_id_zero():
    """parent_task_id=0 est invalide (aucune tache n'a l'id 0)."""
    reset_database()
    with TestClient(app) as client:
        payload = {
            "titre": "Test zero",
            "description": "",
            "etat": "A faire",
            "section": "backend",
            "project_id": PROJECT,
            "parent_task_id": 0,
        }
        resp = client.post("/taches/", json=payload, headers=WRITE_HEADERS)
        assert resp.status_code == 422


def test_reject_negative_parent_id():
    """parent_task_id negatif doit etre rejete."""
    reset_database()
    with TestClient(app) as client:
        payload = {
            "titre": "Test negatif",
            "description": "",
            "etat": "A faire",
            "section": "backend",
            "project_id": PROJECT,
            "parent_task_id": -1,
        }
        resp = client.post("/taches/", json=payload, headers=WRITE_HEADERS)
        assert resp.status_code == 422


# ---------- Listing avec filtre parent ----------


def test_list_returns_correct_parent_ids():
    """GET /taches/ retourne les bons parent_task_id pour chaque tache."""
    reset_database()
    with TestClient(app) as client:
        root = _create_task(client, "Racine")
        child = _create_task(client, "Enfant", parent_id=root)

        resp = client.get(f"/taches/?project_id={PROJECT}")
        assert resp.status_code == 200
        taches = {t["id"]: t for t in resp.json()["taches"]}

        assert taches[root]["parent_task_id"] is None
        assert taches[child]["parent_task_id"] == root


def test_full_e2e_create_reparent_delete_flow():
    """Scenario complet : creer, reparenter, supprimer, verifier la coherence."""
    reset_database()
    with TestClient(app) as client:
        # 1. Creer un arbre : A → B → C
        a = _create_task(client, "A")
        b = _create_task(client, "B", parent_id=a)
        c = _create_task(client, "C", parent_id=b)

        # 2. Reparenter C sous A directement
        resp = _update_task(client, c, {"parent_task_id": a})
        assert resp.status_code == 200
        assert _get_task(client, c)["parent_task_id"] == a

        # 3. Supprimer B (anciennement milieu de chaine, maintenant feuille)
        resp = client.delete(f"/taches/{b}", headers=WRITE_HEADERS)
        assert resp.status_code == 204

        # 4. Verifier que A et C survivent intacts
        task_a = _get_task(client, a)
        task_c = _get_task(client, c)
        assert task_a["parent_task_id"] is None
        assert task_c["parent_task_id"] == a

        # 5. Supprimer A → C perd son parent
        resp = client.delete(f"/taches/{a}", headers=WRITE_HEADERS)
        assert resp.status_code == 204
        task_c = _get_task(client, c)
        assert task_c["parent_task_id"] is None
