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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
