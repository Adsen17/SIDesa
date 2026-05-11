"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import { popup } from "../../lib/popup";

export default function Sidebar() {
  const pathname = usePathname();

  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logo, setLogo] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem("logo");
    if (savedLogo) setLogo(savedLogo);
  }, []);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("GET ME ERROR:", err);
      }
    }

    fetchMe();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    popup
      .confirm({
        title: "Yakin logout?",
        text: "Sesi login akan diakhiri.",
        confirmText: "Ya, logout",
        cancelText: "Batal",
        icon: "warning",
      })
      .then(async (r) => {
        if (!r.isConfirmed) return;

        try {
          await fetch("/api/logout", {
            method: "POST",
          });

          await popup.toastSuccess("Logout berhasil");
        } catch (err) {
          console.error("LOGOUT ERROR:", err);
          await popup.toastError("Logout gagal");
        } finally {
          localStorage.removeItem("logo");
          window.location.href = "/login";
        }
      });
  };

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "📊",
      desc: "Ringkasan sistem",
      roles: ["developer", "owner", "staff"],
    },
    {
      href: "/warga",
      label: "Data Warga",
      icon: "👥",
      desc: "Kelola data warga",
      roles: ["developer", "owner", "staff"],
    },
    {
      href: "/kartu-keluarga",
      label: "Kartu Keluarga",
      icon: "🏠",
      desc: "Kelola data per KK",
      roles: ["developer", "owner", "staff"],
    },
    {
      href: "/settings",
      label: "Settings",
      icon: "⚙️",
      desc: "Pengaturan sistem",
      roles: ["developer", "owner", "staff"],
    },
    {
      href: "/profile",
      label: "Profil",
      icon: "👤",
      desc: "Profil pengguna",
      roles: ["developer", "owner", "staff"],
    },
    {
      href: "/audit-log",
      label: "Audit Log",
      icon: "🧾",
      desc: "Riwayat aktivitas",
      roles: ["developer", "owner"],
    },
  ];

  const filteredMenus = menuItems.filter((item) => {
    if (!user?.role) {
      return item.href === "/dashboard" || item.href === "/warga";
    }
    return item.roles.includes(user.role);
  });

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "developer":
        return "bg-violet-500/15 text-violet-300 border border-violet-400/20";
      case "owner":
        return "bg-amber-500/15 text-amber-300 border border-amber-400/20";
      case "staff":
        return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20";
      default:
        return "bg-slate-500/15 text-slate-300 border border-slate-400/20";
    }
  };

  return (
    <>
      {/* MOBILE TOP BUTTON */}
      <button
        onClick={() => setMobileOpen(true)}
        type="button"
        className="fixed left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/90 text-xl text-white shadow-xl backdrop-blur md:hidden"
      >
        ☰
      </button>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 z-50 h-screen shrink-0 border-r border-white/10 bg-slate-950 text-white transition-all duration-300
          ${mobileOpen ? "left-0" : "-left-full"}
          ${open ? "w-72" : "w-24"}
          md:sticky md:left-0
        `}
      >
        <div className="flex h-full flex-col p-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-xl backdrop-blur">
            <div
              className={`flex items-center ${
                open ? "justify-between" : "justify-center"
              } gap-3`}
            >
              <div
                className={`flex min-w-0 items-center ${
                  open ? "gap-3" : "justify-center"
                }`}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 text-xl shadow-lg shadow-blue-900/30">
                    🏠
                  </div>
                )}

                {open && (
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold tracking-tight">
                      SI Desa
                    </h1>
                    <p className="truncate text-xs text-slate-400">
                      Sistem informasi warga
                    </p>
                  </div>
                )}
              </div>

              {open && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileOpen(false)}
                    type="button"
                    className="rounded-xl bg-white/10 px-2.5 py-2 text-sm text-slate-300 transition hover:bg-white/15 hover:text-white md:hidden"
                  >
                    ✕
                  </button>

                  <button
                    onClick={() => setOpen(false)}
                    type="button"
                    className="hidden rounded-xl bg-white/10 px-2.5 py-2 text-sm text-slate-300 transition hover:bg-white/15 hover:text-white md:block"
                  >
                    ←
                  </button>
                </div>
              )}
            </div>

            {open && (
              <div className="mt-4 rounded-2xl bg-slate-100 dark:bg-slate-900/70 p-3 ring-1 ring-white/5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-bold uppercase text-white">
                    {user?.username?.[0] || "U"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {user?.username || "Memuat user..."}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${getRoleBadge(
                          user?.role
                        )}`}
                      >
                        {user?.role || "guest"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!open && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setOpen(true)}
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg text-white shadow-lg backdrop-blur transition hover:bg-white/10"
              >
                →
              </button>
            </div>
          )}

          <div className="mt-6 flex-1 overflow-y-auto pr-1">
            {open && (
              <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Navigasi
              </p>
            )}

            <nav
              className={`space-y-2 ${
                open ? "" : "flex flex-col items-center"
              }`}
            >
              {filteredMenus.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center overflow-hidden transition-all duration-200 ${
                      open
                        ? `gap-3 rounded-2xl px-3 py-3 ${
                            active
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`
                        : `h-14 w-14 justify-center rounded-2xl ${
                            active
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30"
                              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                          }`
                    }`}
                    title={!open ? item.label : ""}
                  >
                    <span
                      className={`flex shrink-0 items-center justify-center text-lg transition ${
                        open
                          ? active
                            ? "h-11 w-11 rounded-2xl bg-white/15"
                            : "h-11 w-11 rounded-2xl bg-white/5 group-hover:bg-white/10"
                          : "h-10 w-10"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {open && (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.label}
                        </p>
                        <p
                          className={`truncate text-xs ${
                            active ? "text-white/75" : "text-slate-500"
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>
                    )}

                    {open && active && (
                      <span className="absolute right-3 h-2 w-2 rounded-full bg-white shadow" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
            <div
              className={`space-y-3 ${
                open ? "" : "flex flex-col items-center"
              }`}
            >

              <button
                onClick={handleLogout}
                className={`flex items-center justify-center gap-2 rounded-2xl bg-rose-500/90 text-sm font-medium text-white transition hover:bg-rose-600 ${
                  open ? "w-full px-4 py-3" : "h-14 w-14"
                }`}
                type="button"
                title={!open ? "Logout" : ""}
              >
                <span>🔓</span>
                {open && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}