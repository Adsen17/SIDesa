import "./globals.css";
import { WargaProvider } from "./context/WargaContext";
import { ThemeProvider } from "./context/ThemeContext";
import SessionTimeout from "./components/SessionTimeout";

export const metadata = {
  title: "SI KKN — Sistem Informasi Data Warga Desa",
  description:
    "Sistem Informasi Data Warga Desa berbasis web. Kelola data penduduk, kartu keluarga, dan statistik desa secara real-time.",
  keywords: ["data warga", "sistem informasi desa", "KKN", "kartu keluarga", "data penduduk"],
  authors: [{ name: "Tim KKN" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "SI KKN — Sistem Informasi Data Warga Desa",
    description: "Kelola data warga dan kartu keluarga desa secara digital.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#081225",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <WargaProvider>
            <SessionTimeout />

            <div className="min-h-screen relative overflow-hidden">
              <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.10),_transparent_24%),linear-gradient(to_bottom_right,_#f8fafc,_#eef2ff,_#f8fafc)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_20%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)]" />
              <div className="fixed inset-0 -z-10 backdrop-blur-[1px]" />
              <div className="relative">{children}</div>
            </div>
          </WargaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}