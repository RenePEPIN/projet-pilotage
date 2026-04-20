import os
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

# Force une base SQLite dédiée aux tests avant l'import de l'app.
TEST_DB_PATH = Path("data/test_api.db")
os.environ["DATABASE_URL"] = f"sqlite:///./{TEST_DB_PATH.as_posix()}"
# Force une clé d'API connue pour les tests, quelle que soit la valeur de l'env.
os.environ["WRITE_API_KEY"] = "test-write-key"

from database import Base, engine  # noqa: E402
from main import app  # noqa: E402

WRITE_HEADERS = {"X-API-Key": "test-write-key"}


def reset_database() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def setup_module() -> None:
    TEST_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    Base.metadata.create_all(bind=engine)


def teardown_module() -> None:
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


def test_health_db() -> None:
    reset_database()
    with TestClient(app) as client:
        response = client.get("/health/db")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["database"] == "sqlite"


def test_health_db_masks_internal_error_details() -> None:
    reset_database()
    with patch("routers.health.ping_database", side_effect=RuntimeError("db-secret-error")):
        with TestClient(app) as client:
            response = client.get("/health/db")

    assert response.status_code == 503
    assert response.json()["detail"] == "DB indisponible"


def test_db_rejects_invalid_tache_status_value() -> None:
    reset_database()

    with engine.begin() as connection:
        try:
            connection.execute(
                text(
                    """
                    INSERT INTO taches (titre, description, etat, section, project_id)
                    VALUES (:titre, :description, :etat, :section, :project_id)
                    """
                ),
                {
                    "titre": "Statut invalide",
                    "description": "Doit etre bloque par la contrainte SQLAlchemy",
                    "etat": "Bloquee",
                    "section": "backend",
                    "project_id": "projet-api-principal",
                },
            )
        except IntegrityError:
            return

    raise AssertionError("La base devrait refuser un etat hors enum")


def test_api_reads_existing_terminee_status_value() -> None:
    reset_database()

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                INSERT INTO taches (titre, description, etat, section, project_id)
                VALUES (:titre, :description, :etat, :section, :project_id)
                """
            ),
            {
                "titre": "Tache terminee existante",
                "description": "Controle de lecture des valeurs enum en base",
                "etat": "Terminee",
                "section": "backend",
                "project_id": "projet-api-principal",
            },
        )

    with TestClient(app) as client:
        response = client.get("/taches/?limit=10&offset=0")

    assert response.status_code == 200
    payload = response.json()
    task = next(item for item in payload["taches"] if item["titre"] == "Tache terminee existante")
    assert task["etat"] == "Terminee"


def test_crud_tache_flow() -> None:
    reset_database()
    with TestClient(app) as client:
        projects_response = client.get("/projects/")
    assert projects_response.status_code == 200
    projects = projects_response.json()["projects"]
    assert len(projects) >= 1

    create_payload = {
        "titre": "Ecrire les tests",
        "description": "Tester CRUD FastAPI",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
        "due_date": "2026-04-25",
    }

    with TestClient(app) as client:
        create_response = client.post(
            "/taches/",
            json=create_payload,
            headers=WRITE_HEADERS,
        )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"] == 1
    assert created["titre"] == create_payload["titre"]
    assert created["due_date"] == "2026-04-25"

    with TestClient(app) as client:
        list_response = client.get("/taches/")
    assert list_response.status_code == 200
    listed = list_response.json()["taches"]
    assert len(listed) == 1
    assert listed[0]["id"] == 1

    with TestClient(app) as client:
        detail_response = client.get("/taches/1")
    assert detail_response.status_code == 200
    assert detail_response.json()["etat"] == "A faire"
    assert detail_response.json()["project_id"] == "projet-api-principal"
    assert detail_response.json()["due_date"] == "2026-04-25"

    update_payload = {
        "titre": "Ecrire les tests (MAJ)",
        "description": "CRUD + health",
        "etat": "En cours",
        "section": "frontend",
        "project_id": "lis-taches-apres-reunion",
        "due_date": "2026-04-30",
    }
    with TestClient(app) as client:
        update_response = client.put(
            "/taches/1",
            json=update_payload,
            headers=WRITE_HEADERS,
        )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["titre"] == "Ecrire les tests (MAJ)"
    assert updated["etat"] == "En cours"
    assert updated["section"] == "frontend"
    assert updated["project_id"] == "lis-taches-apres-reunion"
    assert updated["due_date"] == "2026-04-30"

    with TestClient(app) as client:
        delete_response = client.delete("/taches/1", headers=WRITE_HEADERS)
    assert delete_response.status_code == 204

    with TestClient(app) as client:
        missing_response = client.get("/taches/1")
    assert missing_response.status_code == 404


def test_dependency_parent_delete_sets_null() -> None:
    reset_database()
    parent_payload = {
        "titre": "Parent backend",
        "description": "Tache racine",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
        "parent_task_id": None,
    }
    child_payload = {
        "titre": "Enfant backend",
        "description": "Depend du parent",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
        "parent_task_id": None,
    }

    with TestClient(app) as client:
        parent_response = client.post(
            "/taches/",
            json=parent_payload,
            headers=WRITE_HEADERS,
        )
        assert parent_response.status_code == 201
        parent_id = parent_response.json()["id"]

        child_payload["parent_task_id"] = parent_id
        child_response = client.post(
            "/taches/",
            json=child_payload,
            headers=WRITE_HEADERS,
        )
        assert child_response.status_code == 201
        child_id = child_response.json()["id"]
        assert child_response.json()["parent_task_id"] == parent_id

        delete_response = client.delete(
            f"/taches/{parent_id}",
            headers=WRITE_HEADERS,
        )
        assert delete_response.status_code == 204

        child_detail_response = client.get(f"/taches/{child_id}")
        assert child_detail_response.status_code == 200
        assert child_detail_response.json()["parent_task_id"] is None


def test_reject_unknown_parent_dependency() -> None:
    reset_database()
    payload = {
        "titre": "Tache invalide",
        "description": "Parent inexistant",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
        "parent_task_id": 9999,
    }

    with TestClient(app) as client:
        response = client.post(
            "/taches/",
            json=payload,
            headers=WRITE_HEADERS,
        )

    assert response.status_code == 422
    assert response.json()["detail"] == "Tache parente introuvable"


def test_project_rename() -> None:
    reset_database()
    with TestClient(app) as client:
        rename_response = client.patch(
            "/projects/projet-api-principal",
            json={"name": "Projet API Renomme"},
            headers=WRITE_HEADERS,
        )
    assert rename_response.status_code == 200
    assert rename_response.json()["name"] == "Projet API Renomme"

    with TestClient(app) as client:
        list_response = client.get("/projects/")
    assert list_response.status_code == 200
    assert any(
        project["id"] == "projet-api-principal" and project["name"] == "Projet API Renomme"
        for project in list_response.json()["projects"]
    )


def test_direct_cycle_rejected() -> None:
    """A → B → A doit être refusé avec 422."""
    reset_database()
    base = {
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
        "parent_task_id": None,
    }

    with TestClient(app) as client:
        # Créer A (racine)
        resp_a = client.post("/taches/", json={**base, "titre": "A"}, headers=WRITE_HEADERS)
        assert resp_a.status_code == 201
        id_a = resp_a.json()["id"]

        # Créer B avec parent = A
        resp_b = client.post(
            "/taches/",
            json={**base, "titre": "B", "parent_task_id": id_a},
            headers=WRITE_HEADERS,
        )
        assert resp_b.status_code == 201
        id_b = resp_b.json()["id"]

        # Tenter de faire pointer A vers B → cycle A→B→A
        resp_cycle = client.put(
            f"/taches/{id_a}",
            json={**base, "titre": "A", "parent_task_id": id_b},
            headers=WRITE_HEADERS,
        )
        assert resp_cycle.status_code == 422
        assert "cycle" in resp_cycle.json()["detail"].lower()


def test_cannot_create_cycle_chain_of_5() -> None:
    """Chaîne T1→T2→T3→T4→T5 puis T1.parent = T5 doit être refusé."""
    reset_database()
    base = {
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }

    ids = []
    with TestClient(app) as client:
        # Créer 5 tâches en chaîne
        for i in range(1, 6):
            parent = ids[-1] if ids else None
            resp = client.post(
                "/taches/",
                json={**base, "titre": f"T{i}", "parent_task_id": parent},
                headers=WRITE_HEADERS,
            )
            assert resp.status_code == 201, f"Creation T{i} echouee: {resp.json()}"
            ids.append(resp.json()["id"])

        # Tenter de faire pointer T1 vers T5 → cycle T1→T2→T3→T4→T5→T1
        resp_cycle = client.put(
            f"/taches/{ids[0]}",
            json={**base, "titre": "T1", "parent_task_id": ids[4]},
            headers=WRITE_HEADERS,
        )
        assert resp_cycle.status_code == 422
        assert "cycle" in resp_cycle.json()["detail"].lower()


def test_project_create_conflict_on_duplicate_id() -> None:
    reset_database()
    payload = {
        "id": "projet-api-principal",
        "name": "Projet API Principal Bis",
    }

    with TestClient(app) as client:
        response = client.post(
            "/projects/",
            json=payload,
            headers=WRITE_HEADERS,
        )

    assert response.status_code == 409


def test_write_requires_api_key() -> None:
    reset_database()
    payload = {
        "titre": "Creation non autorisee",
        "description": "Doit etre bloquee sans cle API",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }

    with TestClient(app) as client:
        response = client.post("/taches/", json=payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Cle API invalide"


def test_reject_parent_from_another_project() -> None:
    reset_database()
    parent_payload = {
        "titre": "Parent autre projet",
        "description": "Doit rester dans son projet",
        "etat": "A faire",
        "section": "backend",
        "project_id": "lis-taches-apres-reunion",
    }
    child_payload = {
        "titre": "Enfant projet principal",
        "description": "Dependance cross-projet interdite",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }

    with TestClient(app) as client:
        parent_response = client.post(
            "/taches/",
            json=parent_payload,
            headers=WRITE_HEADERS,
        )
        assert parent_response.status_code == 201
        parent_id = parent_response.json()["id"]

        child_payload["parent_task_id"] = parent_id
        child_response = client.post(
            "/taches/",
            json=child_payload,
            headers=WRITE_HEADERS,
        )

    assert child_response.status_code == 422
    assert child_response.json()["detail"] == "La dependance doit appartenir au meme projet"


def test_reject_self_dependency_on_update() -> None:
    reset_database()
    payload = {
        "titre": "Tache autonome",
        "description": "Self dependency interdite",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }

    with TestClient(app) as client:
        create_response = client.post(
            "/taches/",
            json=payload,
            headers=WRITE_HEADERS,
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["id"]

        update_payload = dict(payload)
        update_payload["parent_task_id"] = task_id
        update_response = client.put(
            f"/taches/{task_id}",
            json=update_payload,
            headers=WRITE_HEADERS,
        )

    assert update_response.status_code == 422
    assert update_response.json()["detail"] == "Une tache ne peut pas dependre d'elle-meme"


def test_partial_update_keeps_omitted_fields() -> None:
    reset_database()
    create_payload = {
        "titre": "Tache initiale",
        "description": "Description initiale",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
        "due_date": "2026-05-01",
    }

    with TestClient(app) as client:
        create_response = client.post(
            "/taches/",
            json=create_payload,
            headers=WRITE_HEADERS,
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["id"]

        partial_update_payload = {
            "titre": "Titre modifie uniquement",
        }
        update_response = client.put(
            f"/taches/{task_id}",
            json=partial_update_payload,
            headers=WRITE_HEADERS,
        )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["titre"] == "Titre modifie uniquement"
    assert updated["description"] == "Description initiale"
    assert updated["etat"] == "A faire"
    assert updated["section"] == "backend"
    assert updated["project_id"] == "projet-api-principal"
    assert updated["due_date"] == "2026-05-01"


def test_reject_dependency_cycle_on_update() -> None:
    reset_database()
    payload_a = {
        "titre": "Tache A",
        "description": "Racine",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }
    payload_b = {
        "titre": "Tache B",
        "description": "Depend de A",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }

    with TestClient(app) as client:
        response_a = client.post("/taches/", json=payload_a, headers=WRITE_HEADERS)
        response_b = client.post("/taches/", json=payload_b, headers=WRITE_HEADERS)
        assert response_a.status_code == 201
        assert response_b.status_code == 201
        task_a_id = response_a.json()["id"]
        task_b_id = response_b.json()["id"]

        update_b = dict(payload_b)
        update_b["parent_task_id"] = task_a_id
        response_update_b = client.put(
            f"/taches/{task_b_id}",
            json=update_b,
            headers=WRITE_HEADERS,
        )
        assert response_update_b.status_code == 200

        update_a = dict(payload_a)
        update_a["parent_task_id"] = task_b_id
        response_update_a = client.put(
            f"/taches/{task_a_id}",
            json=update_a,
            headers=WRITE_HEADERS,
        )

    assert response_update_a.status_code == 422
    assert response_update_a.json()["detail"] == "Cycle de dependances detecte"


def test_list_taches_filters_by_project_id() -> None:
    reset_database()
    payload_a = {
        "titre": "Tache Projet A",
        "description": "Filtre projet",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }
    payload_b = {
        "titre": "Tache Projet B",
        "description": "Filtre projet",
        "etat": "A faire",
        "section": "backend",
        "project_id": "lis-taches-apres-reunion",
    }

    with TestClient(app) as client:
        response_a = client.post("/taches/", json=payload_a, headers=WRITE_HEADERS)
        response_b = client.post("/taches/", json=payload_b, headers=WRITE_HEADERS)
        assert response_a.status_code == 201
        assert response_b.status_code == 201

        filtered = client.get("/taches/", params={"project_id": "projet-api-principal"})

    assert filtered.status_code == 200
    taches = filtered.json()["taches"]
    assert len(taches) == 1
    assert taches[0]["project_id"] == "projet-api-principal"
    assert taches[0]["titre"] == "Tache Projet A"


def test_list_taches_supports_pagination_and_order() -> None:
    reset_database()

    with TestClient(app) as client:
        for i in range(3):
            payload = {
                "titre": f"Tache paginee {i}",
                "description": "Pagination",
                "etat": "A faire",
                "section": "backend",
                "project_id": "projet-api-principal",
            }
            created = client.post("/taches/", json=payload, headers=WRITE_HEADERS)
            assert created.status_code == 201

        response = client.get(
            "/taches/",
            params={"project_id": "projet-api-principal", "limit": 2, "offset": 1},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 2
    assert payload["offset"] == 1
    assert payload["count"] == 3  # total réel, pas la taille de la page
    taches = payload["taches"]
    assert len(taches) == 2
    assert taches[0]["id"] < taches[1]["id"]


def test_update_rejects_unknown_parent_dependency() -> None:
    reset_database()
    payload = {
        "titre": "Tache cible",
        "description": "Parent invalide en update",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }

    with TestClient(app) as client:
        create_response = client.post("/taches/", json=payload, headers=WRITE_HEADERS)
        assert create_response.status_code == 201
        task_id = create_response.json()["id"]

        update_payload = dict(payload)
        update_payload["parent_task_id"] = 9999
        update_response = client.put(
            f"/taches/{task_id}",
            json=update_payload,
            headers=WRITE_HEADERS,
        )

    assert update_response.status_code == 422
    assert update_response.json()["detail"] == "Tache parente introuvable"


def test_update_parent_task_id_null_detaches_dependency() -> None:
    reset_database()
    parent_payload = {
        "titre": "Parent detachement",
        "description": "Parent pour test update null",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }
    child_payload = {
        "titre": "Enfant detachement",
        "description": "Doit perdre son parent apres update",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }

    with TestClient(app) as client:
        parent_response = client.post("/taches/", json=parent_payload, headers=WRITE_HEADERS)
        child_response = client.post("/taches/", json=child_payload, headers=WRITE_HEADERS)
        assert parent_response.status_code == 201
        assert child_response.status_code == 201

        parent_id = parent_response.json()["id"]
        child_id = child_response.json()["id"]

        attach_response = client.put(
            f"/taches/{child_id}",
            json={"parent_task_id": parent_id},
            headers=WRITE_HEADERS,
        )
        assert attach_response.status_code == 200
        assert attach_response.json()["parent_task_id"] == parent_id

        detach_response = client.put(
            f"/taches/{child_id}",
            json={"parent_task_id": None},
            headers=WRITE_HEADERS,
        )
        assert detach_response.status_code == 200
        assert detach_response.json()["parent_task_id"] is None

        detail_response = client.get(f"/taches/{child_id}")
        assert detail_response.status_code == 200
        assert detail_response.json()["parent_task_id"] is None


def test_update_nonexistent_tache_returns_404() -> None:
    reset_database()
    payload = {
        "titre": "Introuvable",
        "description": "Doit renvoyer 404",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }

    with TestClient(app) as client:
        response = client.put("/taches/9999", json=payload, headers=WRITE_HEADERS)

    assert response.status_code == 404
    assert response.json()["detail"] == "Tache introuvable"


def test_delete_nonexistent_tache_returns_404() -> None:
    reset_database()
    with TestClient(app) as client:
        response = client.delete("/taches/9999", headers=WRITE_HEADERS)

    assert response.status_code == 404
    assert response.json()["detail"] == "Tache introuvable"


def test_update_unknown_project_returns_404() -> None:
    reset_database()
    with TestClient(app) as client:
        response = client.patch(
            "/projects/projet-inexistant",
            json={"name": "Impossible"},
            headers=WRITE_HEADERS,
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Projet introuvable"


def test_write_routes_reject_invalid_api_key() -> None:
    reset_database()
    bad_headers = {"X-API-Key": "wrong-key"}
    payload = {
        "titre": "Tache securite",
        "description": "Auth obligatoire",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
    }

    with TestClient(app) as client:
        created = client.post("/taches/", json=payload, headers=WRITE_HEADERS)
        assert created.status_code == 201
        task_id = created.json()["id"]

        create_project = client.post(
            "/projects/",
            json={"id": "projet-test-auth", "name": "Projet test auth"},
            headers=bad_headers,
        )
        patch_project = client.patch(
            "/projects/projet-api-principal",
            json={"name": "Renomme interdit"},
            headers=bad_headers,
        )
        create_tache = client.post("/taches/", json=payload, headers=bad_headers)
        update_tache_response = client.put(
            f"/taches/{task_id}",
            json=payload,
            headers=bad_headers,
        )
        delete_tache_response = client.delete(f"/taches/{task_id}", headers=bad_headers)

    responses = [
        create_project,
        patch_project,
        create_tache,
        update_tache_response,
        delete_tache_response,
    ]
    for response in responses:
        assert response.status_code == 401
        assert response.json()["detail"] == "Cle API invalide"


def test_create_tache_rejects_invalid_due_date_format() -> None:
    reset_database()
    payload = {
        "titre": "Date invalide",
        "description": "Validation schema",
        "etat": "A faire",
        "section": "backend",
        "project_id": "projet-api-principal",
        "due_date": "30-04-2026",
    }

    with TestClient(app) as client:
        response = client.post("/taches/", json=payload, headers=WRITE_HEADERS)

    assert response.status_code == 422


def test_strategic_notes_get_creates_global_row() -> None:
    reset_database()
    with TestClient(app) as client:
        response = client.get("/strategic-notes/")
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == ""
    assert "updated_at" in data


def test_strategic_notes_put_requires_auth() -> None:
    reset_database()
    with TestClient(app) as client:
        response = client.put("/strategic-notes/", json={"content": "Hello"})
    assert response.status_code == 401


def test_strategic_notes_put_roundtrip() -> None:
    reset_database()
    with TestClient(app) as client:
        r1 = client.put(
            "/strategic-notes/",
            json={"content": "Strategie Q2"},
            headers=WRITE_HEADERS,
        )
        assert r1.status_code == 200
        assert r1.json()["content"] == "Strategie Q2"
        r2 = client.get("/strategic-notes/")
    assert r2.status_code == 200
    assert r2.json()["content"] == "Strategie Q2"
