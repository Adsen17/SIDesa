"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "../../components/BackButton";
import { popup } from "../../../lib/popup";
import Sidebar from "../../components/Sidebar";

export default function TambahKK() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    noKK: "",
    alamat: "",
    rt: "",
  });

  const handleSave = async () => {
    if (!form.noKK || !/^\d{16}$/.test(form.noKK)) {
      popup.error("Error", "No. KK harus 16 digit angka.");
      return;
    }
    if (!form.alamat) {
      popup.error("Error", "Alamat wajib diisi.");
      return;
    }
    if (!form.rt) {
      popup.error("Error", "RT wajib dipilih.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/kartu-keluarga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan KK");

      await popup.success("Berhasil!", "Kartu Keluarga baru telah dibuat.");
      router.push(`/kartu-keluarga/${data.id}`);
    } catch (err) {
      popup.error("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#081225] text-white">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-6 pt-20 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Data Baru
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Tambah Kartu Keluarga
              </h1>
            </div>
            <BackButton fallback="/kartu-keluarga" />
          </div>
        </section>

        <section className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                No. KK (16 Digit)
              </label>
              <input
                type="text"
                placeholder="Masukkan 16 digit Nomor Kartu Keluarga"
                value={form.noKK}
                onChange={(e) => setForm({ ...form, noKK: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Alamat Lengkap
              </label>
              <textarea
                placeholder="Contoh: Jl. Mawar No. 5"
                rows={3}
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Pilih RT
              </label>
              <select
                value={form.rt}
                onChange={(e) => setForm({ ...form, rt: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Pilih RT</option>
                {["1", "2", "3", "4", "5"].map((rt) => (
                  <option key={rt} value={rt}>
                    RT {rt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Kartu Keluarga"}
            </button>
          </div>
        </section>
      </div>
      </main>
    </div>
  );
}
