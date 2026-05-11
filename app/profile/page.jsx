"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import BackButton from "../components/BackButton";
import PageTopbar from "../components/PageTopbar";
import { popup } from "../../lib/popup";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const [form, setForm] = useState({
    username: "",
    oldPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Gagal mengambil profil");
      const data = await res.json();
      setUser(data);
      setForm((prev) => ({ ...prev, username: data.username }));
    } catch (err) {
      console.error(err);
      popup.error("Error", "Gagal memuat profil pengguna");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.username) {
      popup.error("Error", "Username tidak boleh kosong");
      return;
    }

    if (form.newPassword && !form.oldPassword) {
      popup.error("Error", "Masukkan password lama untuk mengubah password");
      return;
    }

    popup
      .confirm({
        title: "Update Profil?",
        text: "Pastikan data sudah benar sebelum menyimpan.",
        confirmText: "Ya, simpan",
      })
      .then(async (result) => {
        if (!result.isConfirmed) return;

        try {
          const res = await fetch("/api/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Gagal mengupdate profil");
          }

          if (data.message === "Tidak ada data yang diubah") {
            popup.info("Info", data.message);
            return;
          }

          popup.toastSuccess("Profil berhasil diperbarui");
          setForm((prev) => ({ ...prev, oldPassword: "", newPassword: "" }));
          fetchProfile();
        } catch (err) {
          popup.error("Error", err.message);
        }
      });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      dateStyle: "long",
      timeStyle: "medium",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#081225] text-white">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-lg backdrop-blur">
            Memuat profil...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#081225] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <PageTopbar
            eyebrow="Pengaturan Akun"
            title="Profil Pengguna"
            subtitle="Kelola informasi pribadi dan keamanan akun Anda."
            leftSlot={<BackButton fallback="/dashboard" />}
          />

          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-1 space-y-6"
            >
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-xl backdrop-blur">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl font-bold uppercase text-white shadow-lg shadow-blue-600/30">
                  {user?.username?.[0] || "U"}
                </div>
                <h3 className="mt-4 text-xl font-bold">{user?.username}</h3>
                <p className="mt-1 text-sm font-medium uppercase tracking-widest text-blue-400">
                  {user?.role}
                </p>
                <div className="mt-6 border-t border-white/10 pt-4 text-left">
                  <p className="text-xs font-medium text-slate-500">Terdaftar Sejak</p>
                  <p className="mt-1 text-sm font-semibold">{formatDate(user?.createdAt)}</p>
                </div>
                <div className="mt-3 text-left">
                  <p className="text-xs font-medium text-slate-500">Last Login</p>
                  <p className="mt-1 text-sm font-semibold">{formatDate(user?.lastLogin)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="col-span-1 md:col-span-2"
            >
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
                <h2 className="text-lg font-bold">Edit Informasi Profil</h2>
                <p className="mt-1 text-sm text-slate-400">Perbarui username atau ganti password akun Anda.</p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Username
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                      placeholder="Masukkan username baru"
                    />
                  </div>

                  <hr className="border-white/10" />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Password Lama
                    </label>
                    <input
                      type="password"
                      value={form.oldPassword}
                      onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                      placeholder="Wajib diisi jika ingin mengganti password"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                      placeholder="Masukkan password baru"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpdate}
                      className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
