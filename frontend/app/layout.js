import { Suspense } from "react";
import "./globals.css";
import AppShell from "./components/app-shell";

export const metadata = {
  title: "App de pilotage",
  description: "Gestion des projets Todo et de leurs taches",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Suspense fallback={<div className="shell-suspense-fallback" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
