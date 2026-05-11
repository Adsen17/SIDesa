"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { popup } from "../../lib/popup";
import Sidebar from "../components/Sidebar";
import { maskNIK } from "../utils/mask";
import { isAdmin } from "../utils/role";

export default function KartuKeluargaPage() {
  const [dataKK, setDataKK] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRT, setFilterRT] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetchData();
    fetch("/api/me", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((res) => setRole(res.role || null))
      .catch(() => setRole(null));
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch("/api/kartu-keluarga", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal ambil data");
      const result = await res.json();
      setDataKK(result);
    } catch (err) {
      popup.error("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = (id, noKK) => {
    popup
      .confirm({
        title: "Hapus Kartu Keluarga?",
        text: `KK ${noKK} akan dihapus. Anggota keluarga tidak akan terhapus, hanya dikeluarkan dari KK.`,
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
        icon: "warning",
      })
      .then(async (r) => {
        if (!r.isConfirmed) return;
        try {
          const res = await fetch(`/api/kartu-keluarga?id=${id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Gagal menghapus data");
          await popup.success("Berhasil", "Kartu Keluarga berhasil dihapus.");
          fetchData();
        } catch (err) {
          popup.error("Error", err.message);
        }
      });
  };

  const handleExport = () => {
    try {
      const exportData = dataKK.flatMap((kk) => {
        if (!kk.anggota || kk.anggota.length === 0) {
          return {
            "No. KK": isAdmin(role) ? kk.noKK : maskNIK(kk.noKK),
            "Alamat": kk.alamat,
            "RT": kk.rt,
            "Nama Anggota": "-",
            "NIK": "-",
            "Hubungan KK": "-",
            "Gender": "-",
            "Pekerjaan": "-",
            "Status": "-",
          };
        }

        return kk.anggota.map((a) => ({
          "No. KK": isAdmin(role) ? kk.noKK : maskNIK(kk.noKK),
          "Alamat": kk.alamat,
          "RT": kk.rt,
          "Nama Anggota": a.nama,
          "NIK": isAdmin(role) ? a.nik : maskNIK(a.nik),
          "Hubungan KK": a.hubunganKeluarga ? a.hubunganKeluarga.replace(/_/g, " ") : "-",
          "Gender": a.gender === "laki_laki" ? "Laki-laki" : "Perempuan",
          "Pekerjaan": a.pekerjaan || "-",
          "Status": a.status || "-",
        }));
      });

      if (exportData.length === 0) {
        popup.error("Gagal", "Tidak ada data untuk di-export");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const colWidths = Object.keys(exportData[0]).map(key => ({ wch: Math.max(15, key.length + 5) }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Kartu Keluarga");
      XLSX.writeFile(wb, "Data_Kartu_Keluarga.xlsx");

      popup.toastSuccess("Export Excel KK berhasil");
    } catch {
      popup.toastError("Export Excel gagal");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredKK.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredKK.map((kk) => kk.id));
    }
  };

  const handleMultiDelete = () => {
    popup
      .confirm({
        title: `Hapus ${selectedIds.length} KK?`,
        text: "Semua KK yang dipilih akan dihapus. Data anggota warga di dalamnya tidak akan terhapus.",
        confirmText: "Ya, Hapus Semua",
        cancelText: "Batal",
        icon: "warning",
      })
      .then(async (r) => {
        if (!r.isConfirmed) return;
        try {
          for (const id of selectedIds) {
            await fetch(`/api/kartu-keluarga?id=${id}`, {
              method: "DELETE",
            });
          }
          await popup.success("Berhasil", "Semua Kartu Keluarga terpilih berhasil dihapus.");
          setSelectedIds([]);
          fetchData();
        } catch (err) {
          popup.error("Error", "Gagal menghapus beberapa data.");
        }
      });
  };

  const filteredKK = useMemo(() => {
    let result = dataKK;

    if (search) {
      const keyword = search.toLowerCase();
      result = result.filter(
        (kk) =>
          kk.noKK.includes(keyword) ||
          kk.alamat?.toLowerCase().includes(keyword) ||
          kk.anggota.some((a) => a.nama.toLowerCase().includes(keyword))
      );
    }

    if (filterRT) {
      result = result.filter((kk) => kk.rt === filterRT);
    }

    return result;
  }, [dataKK, search, filterRT]);

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#081225] text-white">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-6 pt-20 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Manajemen Data
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Kartu Keluarga
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Kelola data penduduk berdasarkan pengelompokan Kartu Keluarga.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleExport}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-6 font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700 active:scale-95"
              >
                Unduh Laporan (Excel)
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleMultiDelete}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-rose-600 px-6 font-medium text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-700 active:scale-95"
                >
                  Hapus ({selectedIds.length})
                </button>
              )}
              <Link
                href="/kartu-keluarga/tambah"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-6 font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
              >
                + Tambah KK Baru
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/40 bg-white/70 p-4 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Cari No. KK, Alamat, atau Nama Anggota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <select
              value={filterRT}
              onChange={(e) => setFilterRT(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 md:w-48 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Semua RT</option>
              {["1", "2", "3", "4", "5"].map((rt) => (
                <option key={rt} value={rt}>
                  RT {rt}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-white/40 bg-white/70 p-8 text-center shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
            Memuat data...
          </div>
        ) : filteredKK.length === 0 ? (
          <div className="rounded-3xl border border-white/40 bg-white/70 p-8 text-center text-slate-500 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
            Tidak ada data Kartu Keluarga.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <input
                type="checkbox"
                id="selectAllKK"
                checked={filteredKK.length > 0 && selectedIds.length === filteredKK.length}
                onChange={toggleSelectAll}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="selectAllKK" className="text-sm font-medium text-slate-300 cursor-pointer">
                Pilih Semua KK
              </label>
            </div>
            {filteredKK.map((kk) => (
              <div
                key={kk.id}
                className="overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="border-b border-white/10 bg-white/5 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(kk.id)}
                        onChange={() => toggleSelect(kk.id)}
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold tracking-tight">
                            No. KK: {isAdmin(role) ? kk.noKK : maskNIK(kk.noKK)}
                          </h2>
                          <span className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-400/20">
                            {kk.anggota?.length || 0} Anggota
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {kk.alamat} — RT {kk.rt}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/kartu-keluarga/${kk.id}`}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
                      >
                        Detail & Anggota
                      </Link>
                      <Link
                        href={`/kartu-keluarga/edit/${kk.id}`}
                        className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-500"
                      >
                        Edit KK
                      </Link>
                      <button
                        onClick={() => handleDelete(kk.id, kk.noKK)}
                        className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-white/5">
                      <tr className="text-left text-slate-600 dark:text-slate-300">
                        <th className="px-6 py-3 font-medium">#</th>
                        <th className="px-6 py-3 font-medium">Nama Lengkap</th>
                        <th className="px-6 py-3 font-medium">NIK</th>
                        <th className="px-6 py-3 font-medium">Hubungan</th>
                        <th className="px-6 py-3 font-medium">Gender</th>
                        <th className="px-6 py-3 font-medium">Tgl Lahir</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                      {(!kk.anggota || kk.anggota.length === 0) ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-slate-400"
                          >
                            Belum ada anggota keluarga
                          </td>
                        </tr>
                      ) : (
                        kk.anggota.map((w, index) => (
                          <tr
                            key={w.id}
                            className="transition hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                          >
                            <td className="px-6 py-4 text-slate-400">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {w.nama}
                            </td>
                            <td className="px-6 py-4">{w.nik}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                {w.hubunganKeluarga?.replace("_", " ") || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 capitalize">
                              {w.gender.replace("_", " ")}
                            </td>
                            <td className="px-6 py-4">{w.tanggalLahir || "-"}</td>
                            <td className="px-6 py-4">
                              {w.status === "Hidup" ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                  Hidup
                                </span>
                              ) : w.status === "Meninggal" ? (
                                <span className="inline-flex items-center gap-1.5 text-slate-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                  Meninggal
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
