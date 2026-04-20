"""One-shot: split app/globals.css into app/styles/*.css (run from repo root if needed)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
SRC = APP / "globals.css"
lines = SRC.read_text(encoding="utf-8").splitlines(keepends=True)

ranges: list[tuple[str, int, int, str]] = [
    ("styles/tokens.css", 3, 33, "Jetons CSS (:root)"),
    ("styles/base.css", 35, 71, "Base (body, focus, skip-link)"),
    ("styles/layout-shell.css", 73, 321, "Grille app-shell et barres"),
    ("styles/pages-common.css", 322, 619, "Coquilles page : travel-shell, hero, KPI grille"),
    ("styles/board-board.css", 620, 771, "Tableau de bord : KPI strip, pagination"),
    ("styles/calendar.css", 772, 1287, "Calendrier projet"),
    ("styles/tables-forms-guide.css", 1288, 1601, "Tableaux, backlog, guide, formulaire detail"),
    (
        "styles/views-kanban-responsive.css",
        1602,
        len(lines),
        "Onglets vues, Kanban, listes, media queries",
    ),
]

for rel, a, b, title in ranges:
    p = APP / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    chunk = "".join(lines[a - 1 : b])
    header = (
        f"/* {title} — import depuis globals.css ; ordre de cascade global à respecter. */\n"
    )
    p.write_text(header + chunk, encoding="utf-8")
    print("Wrote", rel, "lines", a, "-", b)

new_globals = """/* Point d'entrée unique : ordre des @import = ordre de cascade. */
@import "../style/normalize.css";
@import "./styles/tokens.css";
@import "./styles/base.css";
@import "./styles/layout-shell.css";
@import "./styles/pages-common.css";
@import "./styles/board-board.css";
@import "./styles/calendar.css";
@import "./styles/tables-forms-guide.css";
@import "./styles/views-kanban-responsive.css";
"""
SRC.write_text(new_globals, encoding="utf-8")
print("Updated globals.css (imports only)")
