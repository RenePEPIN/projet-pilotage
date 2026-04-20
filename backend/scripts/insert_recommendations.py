"""Insere les recommandations de la phase 9 dans la base en tant que taches."""

import sys
from pathlib import Path

# Ajout du dossier backend au PYTHONPATH
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from core.task_status import Etat  # noqa: E402
from database import Base  # noqa: E402
from models.tache import TacheModel  # noqa: E402

# URL de base de donnees (identique au backend)
DATABASE_URL = "sqlite:///./projet.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Cree les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

recommendations = [
    # Quick Wins (1-2 heures chacun)
    {
        "titre": "Ajouter la documentation OpenAPI/Swagger a FastAPI",
        "description": "Generer automatiquement la documentation API depuis les schemas Pydantic via le support OpenAPI integre de FastAPI",
        "etat": Etat.A_FAIRE,
        "section": "Quick Wins",
        "project_id": "projet-api-principal",
    },
    {
        "titre": "Ajouter le contexte de securite au README",
        "description": "Documenter CSP, CORS, limitation de debit et protections de securite dans le README du projet",
        "etat": Etat.A_FAIRE,
        "section": "Quick Wins",
        "project_id": "projet-api-principal",
    },
    # Enhancement (demi-journee)
    {
        "titre": "Mettre en place des benchmarks automatiques de chargement des taches",
        "description": "Ajouter des tests de performance pour suivre les temps de chargement apres les ameliorations de pagination QW-50",
        "etat": Etat.A_FAIRE,
        "section": "Enhancement",
        "project_id": "projet-api-principal",
    },
    {
        "titre": "Ajouter des tests d'integration du flux complet parent-enfant",
        "description": "Tester les scenarios de bout en bout pour la creation de hierarchie, les mises a jour et la validation des dependances",
        "etat": Etat.A_FAIRE,
        "section": "Enhancement",
        "project_id": "projet-api-principal",
    },
    # Polish (ameliorations complementaires)
    {
        "titre": "Ajouter des hooks pre-commit pour linter et formater de maniere coherente",
        "description": "Configurer pre-commit avec des hooks pylint, black (Python) et eslint (JavaScript)",
        "etat": Etat.A_FAIRE,
        "section": "Polish",
        "project_id": "projet-api-principal",
    },
    {
        "titre": "Documenter le pattern du module validators pour les mainteneurs",
        "description": "Ajouter une documentation et des exemples montrant comment etendre le nouveau pattern du module validators",
        "etat": Etat.A_FAIRE,
        "section": "Polish",
        "project_id": "projet-api-principal",
    },
]


def main():
    session = Session(engine)

    try:
        # Verifie si des recommandations existent deja
        existing = (
            session.query(TacheModel)
            .filter(
                TacheModel.project_id == "projet-api-principal",
                TacheModel.section.in_(["Quick Wins", "Enhancement", "Polish"]),
            )
            .count()
        )

        if existing > 0:
            print(
                f"{existing} recommandations deja presentes. Insertion ignoree pour eviter les doublons."
            )
            return

        # Insere les recommandations
        for rec in recommendations:
            task = TacheModel(**rec)
            session.add(task)

        session.commit()
        print(f"✅ {len(recommendations)} recommandations inserees avec succes.")

        # Affiche ce qui a ete insere
        for i, rec in enumerate(recommendations, 1):
            print(f"   {i}. [{rec['section']}] {rec['titre']}")

    except Exception as e:
        session.rollback()
        print(f"❌ Erreur lors de l'insertion des recommandations: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
