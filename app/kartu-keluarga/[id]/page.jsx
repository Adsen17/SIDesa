"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BackButton from "../../components/BackButton";
import { popup } from "../../../lib/popup";
import Sidebar from "../../components/Sidebar";
import { maskNIK } from "../../utils/mask";
import { isAdmin } from "../../utils/role";

export default function DetailKK() {
  const router = useRouter();
  const { id } = useParams();
  
  const [kk, setKk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  
  // States for adding existing member
  const [showAddModal, setShowAddModal] = useState(false);
  const [wargaList, setWargaList] = useState([]);
  const [selectedWarga, setSelectedWarga] = useState("");
  const [selectedHubungan, setSelectedHubungan] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetail();
      fetchWargaTanpaKK();
    }
    fetch("/api/me", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((res) => setRole(res.role || null))
      .catch(() => setRole(null));
  }, [id]);

  async function fetchDetail() {
    try {
      setLoading(true);
      const res = await fetch(`/api/kartu-keluarga?id=${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal ambil data KK");
      const data = await res.json();
      setKk(data);
    } catch (err) {
      popup.error("Error", err.message);
      router.push("/kartu-keluarga");
    } finally {
      setLoading(false);
    }
  }

  async function fetchWargaTanpaKK() {
    try {
      const res = await fetch(`/api/warga`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // Filter warga yang belum punya KK
        setWargaList(data.filter(w => !w.kkId));
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleAddMember = async () => {
    if (!selectedWarga || !selectedHubungan) {
      popup.error("Error", "Warga dan Hubungan Keluarga wajib dipilih.");
      return;
    }

    try {
      setAddingMember(true);
      const res = await fetch("/api/kartu-keluarga/anggota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kkId: id,
          wargaId: selectedWarga,
          hubunganKeluarga: selectedHubungan,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambahkan anggota");
      }

      await popup.success("Berhasil", "Anggota keluarga berhasil ditambahkan.");
      setShowAddModal(false);
      setSelectedWarga("");
      setSelectedHubungan("");
      fetchDetail();
      fetchWargaTanpaKK();
    } catch (err) {
      popup.error("Error", err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = (wargaId, nama) => {
    popup.confirm({
      title: "Keluarkan Anggota?",
      text: `${nama} akan dikeluarkan dari KK ini (datanya tidak akan dihapus dari sistem).`,
      confirmText: "Ya, Keluarkan",
      cancelText: "Batal",
      icon: "warning"
    }).then(async (r) => {
      if (!r.isConfirmed) return;

      try {
        const res = await fetch(`/api/kartu-keluarga/anggota?wargaId=${wargaId}`, {
          method: "DELETE"
        });

        if (!res.ok) throw new Error("Gagal mengeluarkan anggota");
        
        await popup.toastSuccess("Anggota berhasil dikeluarkan");
        fetchDetail();
        fetchWargaTanpaKK();
      } catch (err) {
        popup.error("Error", err.message);
      }
    });
  };

  if (loading || !kk) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/40 bg-white/70 p-8 text-center shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          Memuat data KK...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#081225] text-white">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-6 pt-20 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header KK */}
        <section className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Detail Kartu Keluarga
                </p>
                <span className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-500 ring-1 ring-blue-500/20">
                  {kk.anggota.length} Anggota
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                No. KK: {isAdmin(role) ? kk.noKK : maskNIK(kk.noKK)}
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Alamat: {kk.alamat} — RT {kk.rt}
              </p>
            </div>
            <BackButton fallback="/kartu-keluarga" />
          </div>
        </section>

        {/* Tabel Anggota */}
        <section className="overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-col gap-4 border-b border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold tracking-tight">Daftar Anggota Keluarga</h2>
            <div className="flex gap-2">
              <Link
                href={`/warga/tambah?kkId=${kk.id}`}
                className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30"
              >
                + Buat Warga Baru
              </Link>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
              >
                + Pilih Warga Lama
              </button>
            </div>
          </div>

          <div className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-left text-slate-600 dark:text-slate-300">
                  <th className="px-6 py-4 font-medium">#</th>
                  <th className="px-6 py-4 font-medium">NIK</th>
                  <th className="px-6 py-4 font-medium">Nama Lengkap</th>
                  <th className="px-6 py-4 font-medium">Hubungan</th>
                  <th className="px-6 py-4 font-medium">Tgl Lahir</th>
                  <th className="px-6 py-4 font-medium">Agama</th>
                  <th className="px-6 py-4 font-medium">Sekolah</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {kk.anggota.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Belum ada anggota di Kartu Keluarga ini.
                    </td>
                  </tr>
                ) : (
                  kk.anggota.map((w, index) => (
                    <tr key={w.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 text-slate-400">{index + 1}</td>
                      <td className="px-6 py-4">{isAdmin(role) ? w.nik : maskNIK(w.nik)}</td>
                      <td className="px-6 py-4 font-medium">{w.nama}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {w.hubunganKeluarga?.replace("_", " ") || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">{w.tanggalLahir || "-"}</td>
                      <td className="px-6 py-4">{w.agama || "-"}</td>
                      <td className="px-6 py-4">{w.sekolah || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/warga/edit/${w.id}?returnTo=kk`}
                            className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleRemoveMember(w.id, w.nama)}
                            className="rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30"
                          >
                            Keluarkan
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Modal Tambah Warga Lama */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold">Pilih Warga & Hubungan</h3>
            <p className="mt-1 text-sm text-slate-500">Pilih dari daftar warga yang belum memiliki KK.</p>
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Pilih Warga</label>
                <select
                  value={selectedWarga}
                  onChange={(e) => setSelectedWarga(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">-- Pilih Warga --</option>
                  {wargaList.map(w => (
                    <option key={w.id} value={w.id}>{w.nama} ({w.nik})</option>
                  ))}
                </select>
                {wargaList.length === 0 && (
                  <p className="mt-2 text-xs text-rose-500">Semua warga sudah memiliki KK.</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Hubungan Keluarga</label>
                <select
                  value={selectedHubungan}
                  onChange={(e) => setSelectedHubungan(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">-- Pilih Hubungan --</option>
                  {["Kepala_Keluarga", "Istri", "Anak", "Orang_Tua", "Mertua", "Menantu", "Cucu", "Saudara", "Lainnya"].map(h => (
                    <option key={h} value={h}>{h.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleAddMember}
                disabled={addingMember || !selectedWarga || !selectedHubungan}
                className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addingMember ? "Menyimpan..." : "Tambahkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
