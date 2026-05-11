"use client";

import { useMemo, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Link from "next/link";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { maskNIK } from "../utils/mask";
import { isAdmin } from "../utils/role";
import PageTopbar from "../components/PageTopbar";
import TopbarMetaCard from "../components/TopbarMetaCard";
import { popup } from "../../lib/popup";

export default function WargaPage() {
  const [data, setData] = useState([]);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRT, setFilterRT] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortKey, setSortKey] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    fetch("/api/me", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((result) => {
        setRole(result.role || null);
        setUser(result || null);
      })
      .catch(() => {
        setRole(null);
        setUser(null);
      });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  const normalize = (v) => String(v || "").toLowerCase().trim();

  const highlight = (text) => {
    if (!debouncedSearch) return text;

    const safeSearch = debouncedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeSearch})`, "gi");

    return String(text || "").replace(regex, "<mark>$1</mark>");
  };

  const getBadge = (kategori) => {
    switch (kategori) {
      case "bayi":
        return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20";
      case "remaja":
        return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20";
      case "dewasa":
        return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20";
      case "lansia":
        return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/20";
      default:
        return "bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20";
    }
  };

  const getStatusBadge = (status) => {
    if (normalize(status) === "hidup") {
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20";
    }
    if (normalize(status) === "meninggal") {
      return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/20";
    }
    return "bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20";
  };

  const filteredData = useMemo(() => {
    const keyword = normalize(debouncedSearch);

    let result = data.filter((d) => {
      const nama = normalize(d.nama);
      const nik = normalize(d.nik);
      const telp = normalize(d.telp);
      const rt = normalize(d.rt);
      const umur = normalize(d.umur);

      const matchSearch =
        !keyword ||
        nama.includes(keyword) ||
        nik.includes(keyword) ||
        telp.includes(keyword);

      const matchRT = filterRT ? rt === normalize(filterRT) : true;
      const matchKategori = filterKategori
        ? umur === normalize(filterKategori)
        : true;

      return matchSearch && matchRT && matchKategori;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const A = normalize(a[sortKey]);
        const B = normalize(b[sortKey]);

        if (A < B) return sortAsc ? -1 : 1;
        if (A > B) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, debouncedSearch, filterRT, filterKategori, sortKey, sortAsc]);

  const totalData = filteredData.length;
  const totalPage = Math.max(1, Math.ceil(totalData / limit));

  const paginatedData = useMemo(() => {
    const safePage = Math.min(page, totalPage);
    const start = (safePage - 1) * limit;

    return filteredData.slice(start, start + limit);
  }, [filteredData, page, limit, totalPage]);

  useEffect(() => {
    if (page > totalPage) {
      setPage(totalPage);
    }
  }, [page, totalPage]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = paginatedData.map((d) => d.id);

    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const refreshData = async () => {
    try {
      const res = await fetch("/api/warga", {
        cache: "no-store",
      });

      const result = await res.json();

      setData(Array.isArray(result) ? result : []);
    } catch {
      setData([]);
    }
  };

  const handleMultiDelete = () => {
    popup
      .confirm({
        title: `Hapus ${selectedIds.length} data?`,
        text: "Data yang dihapus tidak bisa dikembalikan.",
        confirmText: "Ya, hapus",
        cancelText: "Batal",
        icon: "warning",
      })
      .then(async (r) => {
        if (!r.isConfirmed) return;

        try {
          for (const id of selectedIds) {
            await fetch("/api/warga", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ id }),
            });
          }

          await refreshData();
          setSelectedIds([]);
          popup.toastSuccess("Data terpilih berhasil dihapus");
        } catch {
          popup.error("Gagal", "Terjadi kesalahan saat menghapus data.");
        }
      });
  };

  const handleExport = () => {
    try {
      const exportData = filteredData.map((d, i) => ({
        "No": i + 1,
        "Nama Lengkap": d.nama,
        "NIK": d.nik,
        "No. KK": d.kartuKeluarga?.noKK || "-",
        "Telepon": d.telp,
        "Gender": d.gender === "laki_laki" ? "Laki-laki" : "Perempuan",
        "RT": d.rt,
        "Kategori Umur": d.umur,
        "Tanggal Lahir": d.tanggalLahir || "-",
        "Agama": d.agama || "-",
        "Sekolah": d.sekolah || "-",
        "Pekerjaan": d.pekerjaan || "-",
        "Status": d.status || "-",
        "Hubungan KK": d.hubunganKeluarga ? d.hubunganKeluarga.replace(/_/g, " ") : "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns based on header length
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(12, key.length + 5) }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Warga");
      XLSX.writeFile(wb, "Data_Warga_Desa.xlsx");

      popup.toastSuccess("Export Excel berhasil");
    } catch {
      popup.toastError("Export Excel gagal");
    }
  };

  const handleDelete = (id) => {
    popup
      .confirm({
        title: "Yakin hapus?",
        text: "Data tidak bisa dikembalikan.",
        confirmText: "Ya, hapus",
        cancelText: "Batal",
        icon: "warning",
      })
      .then(async (r) => {
        if (!r.isConfirmed) return;

        try {
          await fetch("/api/warga", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
          });

          await refreshData();
          popup.toastSuccess("Data berhasil dihapus");
        } catch {
          popup.error("Gagal", "Data gagal dihapus");
        }
      });
  };

  const visibleIds = paginatedData.map((d) => d.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#081225] text-white">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 pb-6 pt-20 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-7xl space-y-5 md:space-y-6"
        >
          <PageTopbar
            eyebrow="Manajemen Data"
            title="Data Warga"
            subtitle="Kelola, cari, filter, dan ekspor data warga desa dengan tampilan yang modern dan nyaman digunakan."
            rightSlot={
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <TopbarMetaCard label="Total Data" value={totalData} />
                <TopbarMetaCard label="Role" value={role || "-"} capitalize />
                <TopbarMetaCard label="Per Halaman" value={limit} />
                <TopbarMetaCard label="User" value={user?.username || "-"} />
              </div>
            }
          />

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap no-print"
          >
            <button
              onClick={handleExport}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition"
            >
              Export Excel
            </button>
            
            <button
              onClick={() => window.print()}
              className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition"
            >
              Cetak Data
            </button>

            {selectedIds.length > 0 && isAdmin(role) && (
              <button
                onClick={handleMultiDelete}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700"
              >
                Hapus ({selectedIds.length})
              </button>
            )}

            <Link
              href="/warga/tambah"
              className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition"
            >
              + Tambah Warga
            </Link>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 no-print"
          >
            <FilterCard
              label="Pencarian"
              content={
                <input
                  placeholder="Cari nama, NIK, atau telepon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                />
              }
            />

            <FilterCard
              label="Filter RT"
              content={
                <select
                  value={filterRT}
                  onChange={(e) => {
                    setFilterRT(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option className="bg-slate-900" value="">
                    Semua RT
                  </option>
                  {[1, 2, 3, 4, 5].map((rt) => (
                    <option className="bg-slate-900" key={rt} value={rt}>
                      RT {rt}
                    </option>
                  ))}
                </select>
              }
            />

            <FilterCard
              label="Kategori Umur"
              content={
                <select
                  value={filterKategori}
                  onChange={(e) => {
                    setFilterKategori(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option className="bg-slate-900" value="">
                    Semua Umur
                  </option>
                  {["Bayi", "Remaja", "Dewasa", "Lansia"].map((item) => (
                    <option className="bg-slate-900" key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              }
            />

            <FilterCard
              label="Baris per Halaman"
              content={
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option className="bg-slate-900" value={5}>
                    5 / halaman
                  </option>
                  <option className="bg-slate-900" value={10}>
                    10 / halaman
                  </option>
                  <option className="bg-slate-900" value={20}>
                    20 / halaman
                  </option>
                </select>
              }
            />
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur"
          >
            <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6 no-print">
              <div>
                <h2 className="text-lg font-semibold">Daftar Warga</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Total hasil: {totalData} data
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-300">
                Halaman {page} dari {totalPage || 1}
              </div>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="block space-y-3 p-4 md:hidden">
              {paginatedData.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                  Tidak ada data yang cocok dengan filter saat ini.
                </div>
              ) : (
                paginatedData.map((d, i) => {
                  const kategori = normalize(d.umur);
                  const no = (page - 1) * limit + i + 1;

                  return (
                    <div
                      key={d.id}
                      className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">#{no}</p>
                          <h3
                            className="mt-1 break-words text-base font-semibold"
                            dangerouslySetInnerHTML={{
                              __html: highlight(d.nama),
                            }}
                          />
                        </div>

                        {isAdmin(role) && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(d.id)}
                            onChange={() => toggleSelect(d.id)}
                            className="mt-1 shrink-0"
                          />
                        )}
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4">
                        <MobileInfo
                          label="NIK"
                          value={isAdmin(role) ? d.nik : maskNIK(d.nik)}
                        />
                        <MobileInfo label="No. KK" value={d.kartuKeluarga?.noKK || "-"} />
                        <MobileInfo label="Telepon" value={d.telp} />
                        <MobileInfo
                          label="Gender"
                          value={String(d.gender).replace("_", " ")}
                          capitalize
                        />
                        <MobileInfo label="RT" value={`RT ${d.rt}`} />
                        <MobileInfo label="Tgl Lahir" value={d.tanggalLahir} />
                        <MobileInfo label="Agama" value={d.agama} />
                        <MobileInfo label="Sekolah" value={d.sekolah} />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getBadge(
                              kategori
                            )}`}
                          >
                            {d.umur}
                          </span>
                          {d.status && (
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                                d.status
                              )}`}
                            >
                              {d.status}
                            </span>
                          )}
                        </div>

                        {isAdmin(role) ? (
                          <div className="flex gap-2">
                            <Link
                              href={`/warga/edit/${d.id}`}
                              className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-amber-500"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(d.id)}
                              className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600"
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            View only
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden overflow-x-auto md:block border border-white/10 rounded-2xl">
              <table className="min-w-[1600px] w-full text-sm whitespace-nowrap">
                <thead className="bg-white/5">
                  <tr className="text-left text-slate-300">
                    <th className="px-4 py-4">
                      {isAdmin(role) && (
                        <input
                          type="checkbox"
                          onChange={toggleSelectAll}
                          checked={allVisibleSelected}
                        />
                      )}
                    </th>
                    <th className="px-4 py-4">#</th>
                    <th
                      onClick={() => handleSort("nama")}
                      className="cursor-pointer px-4 py-4"
                    >
                      Nama
                    </th>
                    <th
                      onClick={() => handleSort("nik")}
                      className="cursor-pointer px-4 py-4"
                    >
                      NIK
                    </th>
                    <th className="px-4 py-4">No. KK</th>
                    <th className="px-4 py-4">Telepon</th>
                    <th className="px-4 py-4">Gender</th>
                    <th className="px-4 py-4">RT</th>
                    <th
                      onClick={() => handleSort("umur")}
                      className="cursor-pointer px-4 py-4"
                    >
                      Umur
                    </th>
                    <th className="px-4 py-4">Tgl Lahir</th>
                    <th className="px-4 py-4">Agama</th>
                    <th className="px-4 py-4">Sekolah</th>
                    <th className="px-4 py-4">Pekerjaan</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-4 py-16 text-center text-slate-400"
                      >
                        Tidak ada data yang cocok dengan filter saat ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((d, i) => {
                      const kategori = normalize(d.umur);
                      const no = (page - 1) * limit + i + 1;

                      return (
                        <tr
                          key={d.id}
                          className="border-t border-white/10 transition hover:bg-white/[0.04]"
                        >
                          <td className="px-4 py-4">
                            {isAdmin(role) && (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(d.id)}
                                onChange={() => toggleSelect(d.id)}
                              />
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-400">{no}</td>
                          <td
                            className="px-4 py-4 font-medium"
                            dangerouslySetInnerHTML={{
                              __html: highlight(d.nama),
                            }}
                          />
                          <td className="px-4 py-4">
                            {isAdmin(role) ? d.nik : maskNIK(d.nik)}
                          </td>
                          <td className="px-4 py-4">{d.kartuKeluarga?.noKK || "-"}</td>
                          <td className="px-4 py-4">{d.telp}</td>
                          <td className="px-4 py-4 capitalize">
                            {String(d.gender).replace("_", " ")}
                          </td>
                          <td className="px-4 py-4">RT {d.rt}</td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getBadge(
                                kategori
                              )}`}
                            >
                              {d.umur}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-300">{d.tanggalLahir || "-"}</td>
                          <td className="px-4 py-4 text-slate-300">{d.agama || "-"}</td>
                          <td className="px-4 py-4 text-slate-300">{d.sekolah || "-"}</td>
                          <td className="px-4 py-4 text-slate-300">{d.pekerjaan || "-"}</td>
                          <td className="px-4 py-4">
                            {d.status ? (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                                  d.status
                                )}`}
                              >
                                {d.status}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {isAdmin(role) ? (
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  href={`/warga/edit/${d.id}`}
                                  className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-amber-500"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handleDelete(d.id)}
                                  className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600"
                                >
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">
                                View only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6 no-print">
              <p className="text-sm text-slate-400">
                Menampilkan {paginatedData.length} dari {totalData} data
              </p>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPage || totalPage === 0}
                  onClick={() => setPage(page + 1)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}

function FilterCard({ label, content }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-md backdrop-blur">
      <p className="mb-2 text-sm font-medium text-slate-400">{label}</p>
      {content}
    </div>
  );
}

function MobileInfo({ label, value, capitalize = false }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs font-medium text-slate-400">
        {label}
      </span>
      <span
        className={`text-sm font-semibold text-slate-200 text-right ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value || "-"}
      </span>
    </div>
  );
}