"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toBreadcrumb } from "./app-shell-breadcrumb";
import { IconChevron, IconMenu } from "./app-shell-icons";
import { navGroups } from "./app-shell-nav-config";
import StrategicNotesPanel from "./strategic-notes-panel";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") || "";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isStrategicNotesOpen, setIsStrategicNotesOpen] = useState(false);

  const breadcrumbs = useMemo(() => toBreadcrumb(pathname), [pathname]);

  function handleGlobalSearchSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = String(new FormData(form).get("q") || "").trim();
    if (raw) {
      router.push(`/search?q=${encodeURIComponent(raw)}`);
    } else {
      router.push("/search");
    }
  }

  function isItemActive(href) {
    if (href === "/backlog") {
      return pathname === "/backlog" || pathname.startsWith("/backlog/");
    }
    if (href === "/search") {
      return pathname === "/search";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="shell-root">
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      <aside
        id="app-shell-sidebar"
        className={`shell-sidebar${isCollapsed ? " is-collapsed" : ""}${
          isMobileOpen ? " is-mobile-open" : ""
        }`}
      >
        <div className="shell-sidebar-head">
          <div className="shell-brand">
            <Link href="/projects" className="shell-brand-link">
              Pilotage
            </Link>
            <span className="shell-brand-tagline">Taches &amp; projets</span>
          </div>
          <button
            type="button"
            className="shell-icon-btn"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={
              isCollapsed
                ? "Developper la barre laterale"
                : "Replier la barre laterale"
            }
            title={
              isCollapsed
                ? "Developper la barre laterale"
                : "Replier la barre laterale"
            }
          >
            <IconChevron direction={isCollapsed ? "right" : "left"} />
          </button>
        </div>

        <nav className="shell-nav" aria-label="Navigation rapide">
          {navGroups.map((group) => (
            <section key={group.title} className="shell-nav-group">
              <p className="shell-nav-group-title">{group.title}</p>
              {group.items.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <Link
                    key={`${group.title}-${item.href}-${item.label}`}
                    href={item.href}
                    title={item.label}
                    className={`shell-nav-link${isActive ? " is-active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span className="shell-nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="shell-nav-label">{item.label}</span>
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>
      </aside>

      {isMobileOpen ? (
        <button
          type="button"
          className="shell-mobile-backdrop"
          aria-label="Fermer la navigation"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

      <div className="shell-main">
        <header className="shell-topbar">
          <div className="shell-topbar-left">
            <button
              type="button"
              className="shell-icon-btn mobile-only"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Ouvrir la navigation"
              aria-expanded={isMobileOpen}
              aria-controls="app-shell-sidebar"
            >
              <IconMenu />
            </button>

            <nav className="shell-breadcrumbs" aria-label="Fil d'ariane">
              {breadcrumbs.map((item, index) => (
                <span key={`${item.href}-${index}`} className="shell-crumb">
                  {index > 0 ? (
                    <span className="shell-crumb-sep">/</span>
                  ) : null}
                  <Link href={item.href} className="shell-crumb-link">
                    {item.label}
                  </Link>
                </span>
              ))}
            </nav>
          </div>

          <div className="shell-topbar-right">
            <form
              className="shell-search"
              role="search"
              onSubmit={handleGlobalSearchSubmit}
            >
              <label
                className="shell-search-prefix"
                htmlFor="shell-search-input"
              >
                Recherche
              </label>
              <input
                id="shell-search-input"
                type="search"
                name="q"
                autoComplete="off"
                placeholder="Titre, projet, categorie…"
                title="Recherche globale sur toutes les taches chargees"
                aria-describedby="shell-search-help"
                defaultValue={qFromUrl}
                key={`${pathname}-${qFromUrl}`}
              />
              <p id="shell-search-help" className="shell-search-hint">
                Entree : page Resultats ; portee = toutes les taches (API).
              </p>
            </form>

            <div className="shell-actions" aria-label="Actions rapides">
              <span className="sr-only">Raccourcis</span>
              <button
                type="button"
                className="shell-quick-link"
                onClick={() => setIsStrategicNotesOpen(true)}
                aria-expanded={isStrategicNotesOpen}
                aria-controls={
                  isStrategicNotesOpen ? "strategic-notes-panel" : undefined
                }
                title="Notes strategiques (memoire locale)"
              >
                Notes
              </button>
              <Link href="/backlog" className="shell-quick-link">
                Backlog
              </Link>
              <Link href="/projects" className="shell-quick-link">
                Projets
              </Link>
              <Link
                href="/detail?projectId=projet-api-principal"
                className="shell-quick-link primary"
              >
                + Nouvelle tache
              </Link>
            </div>
          </div>
        </header>

        <main id="main-content" className="shell-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      <StrategicNotesPanel
        open={isStrategicNotesOpen}
        onClose={() => setIsStrategicNotesOpen(false)}
      />
    </div>
  );
}
