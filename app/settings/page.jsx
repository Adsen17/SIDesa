"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import Sidebar from "../components/Sidebar";
import BackButton from "../components/BackButton";
import PageTopbar from "../components/PageTopbar";
import TopbarMetaCard from "../components/TopbarMetaCard";
import { popup } from "../../lib/popup";

export default function SettingsPage() {
  const [tab, setTab] = useState("general");
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [role, setRole] = useState(null);
  const [me, setMe] = useState(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    phone: "",
    role: "staff",
  });

  const isDev = role === "developer";
  const isOwner = role === "owner";
  const canManageUsers = isDev || isOwner;

  useEffect(() => {
    const getMe = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        if (data.role) {
          setRole(data.role);
          setMe(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getMe();
  }, []);

  useEffect(() => {
    if (canManageUsers) {
      getUsers();
    }
  }, [role]);

  useEffect(() => {
    if (!canManageUsers && tab === "users") {
      setTab("general");
    }
  }, [canManageUsers, tab]);

  const getUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  const handleCreate = () => {
    if (!form.username || !form.password || !form.phone) {
      popup.error("Error", "Semua field wajib diisi");
      return;
    }

    popup
      .confirm({
        title: "Buat user baru?",
        text: "User baru akan ditambahkan ke sistem.",
        confirmText: "Ya, buat",
      })
      .then(async (result) => {
        if (!result.isConfirmed) return;

        const res = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!res.ok) {
          popup.error("Error", data.error || "Gagal membuat user");
          return;
        }

        setForm({
          username: "",
          password: "",
          phone: "",
          role: "staff",
        });

        await getUsers();
        popup.toastSuccess("User berhasil dibuat");
      });
  };

  const handleDelete = (id) => {
    popup
      .confirm({
        title: "Hapus user?",
        text: "Data user tidak bisa dikembalikan.",
        confirmText: "Ya, hapus",
        icon: "warning",
      })
      .then(async (result) => {
        if (!result.isConfirmed) return;

        const res = await fetch("/api/users", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        const data = await res.json();

        if (!res.ok) {
          popup.error("Error", data.error || "Gagal menghapus user");
          return;
        }

        await getUsers();
        popup.toastSuccess("User berhasil dihapus");
      });
  };

  const handleUpdate = () => {
    popup
      .confirm({
        title: "Update user?",
        text: "Perubahan akan disimpan.",
        confirmText: "Ya, simpan",
      })
      .then(async (result) => {
        if (!result.isConfirmed) return;

        const res = await fetch("/api/users", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingUser),
        });

        const data = await res.json();

        if (!res.ok) {
          popup.error("Error", data.error || "Gagal update user");
          return;
        }

        setEditingUser(null);
        await getUsers();
        popup.toastSuccess("User berhasil diupdate");
      });
  };

  if (!role) {
    return (
      <div className="flex min-h-screen bg-[#081225] text-white">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-lg backdrop-blur">
            Memuat halaman settings...
          </div>
        </div>
      </div>
    );
  }

  const tabs = canManageUsers
    ? ["general", "users"]
    : ["general"];

  return (
    <div className="flex min-h-screen bg-[#081225] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <PageTopbar
            eyebrow="Pengaturan Sistem"
            title="Settings"
            subtitle="Kelola tampilan, akun pengguna, dan preferensi sistem."
            rightSlot={
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <TopbarMetaCard label="User Aktif" value={me?.username || "-"} />
                <TopbarMetaCard label="Role" value={role} capitalize />
                <TopbarMetaCard
                  label="Hak User"
                  value={canManageUsers ? "Aktif" : "Terbatas"}
                />
              </div>
            }
            leftSlot={<BackButton fallback="/dashboard" />}
          />

          <div className="flex flex-wrap gap-3">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-2xl px-5 py-2.5 text-sm font-medium capitalize transition ${
                  tab === t
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur"
          >
            {tab === "general" && (
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard
                  title="Role Aktif"
                  value={role}
                  desc="Hak akses akun yang sedang digunakan."
                />

                <InfoCard
                  title="User Management"
                  value={canManageUsers ? "Aktif" : "Tidak tersedia"}
                  desc="Hanya owner dan developer yang bisa mengelola user."
                />
              </div>
            )}



            {tab === "users" && canManageUsers && (
              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold">Tambah User</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {isDev
                      ? "Buat akun baru untuk developer, owner, atau staff."
                      : "Buat akun baru untuk owner atau staff."}
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <input
                      placeholder="Username"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    />

                    <input
                      placeholder="Password"
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    />

                    <input
                      placeholder="No HP"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    />

                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    >
                      {isDev && (
                        <option className="bg-slate-900" value="developer">
                          Developer
                        </option>
                      )}
                      <option className="bg-slate-900" value="owner">
                        Owner
                      </option>
                      <option className="bg-slate-900" value="staff">
                        Staff
                      </option>
                    </select>
                  </div>

                  <button
                    onClick={handleCreate}
                    className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                  >
                    Buat User
                  </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold">Daftar User</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Klik salah satu user untuk edit data akun.
                  </p>

                  <div className="mt-5 grid gap-4">
                    {users.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                        Belum ada data user.
                      </div>
                    ) : (
                      users.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            if (isOwner && u.role === "developer") {
                              popup.error(
                                "Akses ditolak",
                                "Owner tidak bisa edit akun developer"
                              );
                              return;
                            }
                            setEditingUser(u);
                          }}
                          className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.07] md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-semibold">{u.username}</p>
                            <p className="mt-1 text-sm text-slate-400">
                              {u.phone} • {u.role}
                              {!u.isActive && (
                                <span className="ml-2 inline-flex rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-300 ring-1 ring-rose-400/20">
                                  Nonaktif
                                </span>
                              )}
                            </p>
                          </div>

                          {(isDev || isOwner) &&
                            !(isOwner && u.role === "developer") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(u.id);
                                }}
                                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                              >
                                Hapus
                              </button>
                            )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1730] p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Edit User</h2>
            <p className="mt-1 text-sm text-slate-400">
              Perbarui informasi akun pengguna.
            </p>

            <div className="mt-5 space-y-4">
              <input
                value={editingUser.username}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, username: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              />

              <input
                type="password"
                placeholder="Password baru (opsional)"
                onChange={(e) =>
                  setEditingUser({ ...editingUser, password: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />

              <input
                value={editingUser.phone}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, phone: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              />

              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              >
                {isDev && (
                  <option className="bg-slate-900" value="developer">
                    Developer
                  </option>
                )}
                <option className="bg-slate-900" value="owner">
                  Owner
                </option>
                <option className="bg-slate-900" value="staff">
                  Staff
                </option>
              </select>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Status Akun</p>
                  <p className="text-xs text-slate-400">
                    {editingUser.isActive ? "Akun aktif dan bisa login" : "Akun dinonaktifkan, tidak bisa login"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingUser({ ...editingUser, isActive: !editingUser.isActive })
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    editingUser.isActive ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      editingUser.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                Batal
              </button>
              <button
                onClick={handleUpdate}
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, value, desc }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <h3 className="mt-2 text-2xl font-bold capitalize">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </div>
  );
}