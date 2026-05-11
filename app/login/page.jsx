"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { popup } from "../../lib/popup";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      popup.error("Error", "Username dan password wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        popup.error("Login Gagal", data.error || "Terjadi kesalahan saat login");
        return;
      }

      await popup.success("Login Berhasil", "Mengalihkan ke dashboard...");
      router.push("/dashboard");
    } catch (error) {
      popup.error("Error", "Terjadi error saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.22),_transparent_25%),linear-gradient(to_bottom_right,_#020617,_#111827,_#0f172a)]" />
      <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl"
      >
        <div className="grid min-h-[620px] lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600/90 via-indigo-600/80 to-fuchsia-600/80 p-10 text-white">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/80">
                SI Desa
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-tight">
                Sistem Informasi Data Warga Desa
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
                Platform modern untuk mengelola data warga desa secara aman,
                cepat, dan profesional dengan tampilan yang lebih meyakinkan.
              </p>
            </div>

            <div className="grid gap-4">
              <FeatureItem
                title="Manajemen Warga"
                desc="Kelola data warga dengan pencarian, filter, dan update cepat."
              />
              <FeatureItem
                title="Keamanan Sistem"
                desc="Autentikasi cookie, pembatasan akses, audit log, dan backup."
              />
              <FeatureItem
                title="Tampilan Modern"
                desc="Dashboard profesional yang lebih nyaman digunakan setiap hari."
              />
            </div>
          </div>

          <div className="flex items-center justify-center bg-white/70 p-8 dark:bg-slate-900/70">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg">
                  🏠
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Welcome Back
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Masuk ke sistem untuk mengakses dashboard dan data warga.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan username"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleLogin();
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-14 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {showPass ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-medium text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Memproses..." : "Login ke Dashboard"}
                </motion.button>
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">
                Sistem manajemen warga desa • Aman • Modern • Profesional
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureItem({ title, desc }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/80">{desc}</p>
    </div>
  );
}