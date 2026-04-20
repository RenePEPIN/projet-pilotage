"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const navGroups = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Backlog", icon: "BL" },
      { href: "/projects/projet-api-principal", label: "Board", icon: "BD" },
      { href: "/projects", label: "Projets", icon: "PR" },
    ],
  },
  {
    title: "Pilotage",
    items: [
      {
        href: "/projects/projet-api-principal",
        label: "API Principal",
        icon: "AP",
      },
      {
        href: "/projects/lis-taches-apres-reunion",
        label: "Post Reunion",
        icon: "RE",
      },
    ],
  },
];

function toBreadcrumb(pathname) {
  if (!pathname || pathname === "/") {
    return [{ label: "Backlog", href: "/" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  let current = "";

  const crumbs = segments.map((segment) => {
    current += `/${segment}`;
    return {
      label: segment
        .replace(/-/g, " ")
        .replace(/^./, (value) => value.toUpperCase()),
      href: current,
    };
  });

  return [{ label: "Backlog", href: "/" }, ...crumbs];
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const breadcrumbs = useMemo(() => toBreadcrumb(pathname), [pathname]);

  function isItemActive(href) {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="shell-root">
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      <aside
        className={`shell-sidebar${isCollapsed ? " is-collapsed" : ""}${isMobileOpen ? " is-mobile-open" : ""}`}
      >
        <div className="shell-sidebar-head">
          <span className="shell-brand">Pilotage</span>
          <button
            type="button"
            className="shell-icon-btn"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label="Replier la barre laterale"
          >
            {isCollapsed ? ">" : "<"}
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
            >
              |||
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
            <label className="shell-search" aria-label="Recherche globale">
              <span className="shell-search-prefix">Recherche</span>
              <input
                type="search"
                placeholder="Rechercher une tache, un projet..."
              />
            </label>

            <div className="shell-actions" aria-label="Actions rapides">
              <Link href="/projects" className="shell-quick-link">
                Projets
              </Link>
              <Link
                href="/detail?projectId=projet-api-principal"
                className="shell-quick-link primary"
              >
                + Tache
              </Link>
            </div>
          </div>
        </header>

        <main id="main-content" className="shell-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
