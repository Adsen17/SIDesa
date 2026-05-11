"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import Sidebar from "../components/Sidebar";
import PageTopbar from "../components/PageTopbar";
import TopbarMetaCard from "../components/TopbarMetaCard";
import { popup } from "../../lib/popup";
import AuditDetailModal from "../components/AuditDetailModal";

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleString("id-ID");
  } catch {
    return "-";
  }
}

function getActionBadge(action = "") {
  if (action.includes("SUCCESS")) {
    return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20";
  }

  if (action.includes("FAILED") || action.includes("BLOCKED")) {
    return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/20";
  }

  if (action.includes("DELETE") || action.includes("CLEAR")) {
    return "bg-red-500/15 text-red-300 ring-1 ring-red-400/20";
  }

  if (action.includes("UPDATE")) {
    return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20";
  }

  if (action.includes("CREATE")) {
    return "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20";
  }

  return "bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20";
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [permissions, setPermissions] = useState({
    canUseRoleFilter: false,
  });

  const [loading, setLoading] = useState(true);
  const [liveUpdate, setLiveUpdate] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    action: "",
    entity: "",
    username: "",
    role: "",
    page: 1,
    limit: 20,
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.q) params.set("q", filters.q);
    if (filters.action) params.set("action", filters.action);
    if (filters.entity) params.set("entity", filters.entity);
    if (filters.username) params.set("username", filters.username);
    if (filters.role) params.set("role", filters.role);

    params.set("page", String(filters.page));
    params.set("limit", String(filters.limit));

    return params.toString();
  }, [filters]);

  async function fetchLogs(showToast = false) {
    try {
      setLoading(true);

      const res = await fetch(`/api/audit-logs?${queryString}`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal mengambil audit log");
      }

      setLogs(result.data || []);
      setMeta(
        result.meta || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        }
      );
      setPermissions(
        result.permissions || {
          canUseRoleFilter: false,
        }
      );

      setLastUpdated(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      if (showToast) {
        popup.toastSuccess("Audit log diperbarui");
      }
    } catch (err) {
      popup.error("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs(false);
  }, [queryString]);

  useEffect(() => {
    if (!liveUpdate) return;

    const interval = setInterval(() => {
      fetchLogs(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [queryString, liveUpdate]);

  const handleClearAll = async () => {
    const confirm = await popup.confirm({
      title: "Hapus semua audit log?",
      text: "Data tidak bisa dikembalikan.",
      confirmText: "Ya, hapus",
      cancelText: "Batal",
      icon: "warning",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("/api/audit-logs/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "all" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal hapus audit log");
      }

      await popup.success(
        "Berhasil",
        `Terhapus ${data.deleted} data audit log`
      );

      fetchLogs(true);
    } catch (err) {
      popup.error("Error", err.message);
    }
  };

  const handleClearOld = async () => {
    const confirm = await popup.confirm({
      title: "Hapus audit log lama?",
      text: "Hanya data lebih dari 30 hari yang akan dihapus.",
      confirmText: "Ya, lanjut",
      cancelText: "Batal",
      icon: "warning",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("/api/audit-logs/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "old", days: 30 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal hapus audit log lama");
      }

      await popup.success(
        "Berhasil",
        `Terhapus ${data.deleted} data audit log lama`
      );

      fetchLogs(true);
    } catch (err) {
      popup.error("Error", err.message);
    }
  };

  const goPrev = () => {
    setFilters((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  };

  const goNext = () => {
    setFilters((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#081225] text-white">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 pb-6 pt-20 md:p-8">
        <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
          <PageTopbar
            eyebrow="Monitoring Sistem"
            title="Audit Log"
            subtitle="Riwayat aktivitas pengguna untuk pelacakan dan keamanan data."
            leftSlot={<BackButton fallback="/dashboard" />}
            rightSlot={
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <TopbarMetaCard label="Total" value={meta.total} />
                <TopbarMetaCard label="Page" value={meta.page} />
                <TopbarMetaCard label="Limit" value={meta.limit} />
                <TopbarMetaCard
                  label="Last Update"
                  value={lastUpdated || "-"}
                />
              </div>
            }
          />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <FilterCard
              label="Search"
              content={
                <input
                  value={filters.q}
                  onChange={(e) =>
                    setFilters({ ...filters, q: e.target.value, page: 1 })
                  }
                  placeholder="Cari..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
              }
            />

            <FilterCard
              label="Username"
              content={
                <input
                  value={filters.username}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      username: e.target.value,
                      page: 1,
                    })
                  }
                  placeholder="Masukkan username"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
              }
            />

            <FilterCard
              label="Action"
              content={
                <select
                  value={filters.action}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      action: e.target.value,
                      page: 1,
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option className="bg-slate-900" value="">
                    Semua
                  </option>
                  <option className="bg-slate-900" value="LOGIN_SUCCESS">
                    LOGIN_SUCCESS
                  </option>
                  <option className="bg-slate-900" value="LOGIN_FAILED">
                    LOGIN_FAILED
                  </option>
                  <option className="bg-slate-900" value="LOGIN_BLOCKED">
                    LOGIN_BLOCKED
                  </option>
                  <option className="bg-slate-900" value="LOGOUT">
                    LOGOUT
                  </option>
                  <option className="bg-slate-900" value="CREATE">
                    CREATE
                  </option>
                  <option className="bg-slate-900" value="UPDATE">
                    UPDATE
                  </option>
                  <option className="bg-slate-900" value="DELETE">
                    DELETE
                  </option>
                </select>
              }
            />

            <FilterCard
              label="Entity"
              content={
                <select
                  value={filters.entity}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      entity: e.target.value,
                      page: 1,
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option className="bg-slate-900" value="">
                    Semua
                  </option>
                  <option className="bg-slate-900" value="AUTH">
                    AUTH
                  </option>
                  <option className="bg-slate-900" value="WARGA">
                    WARGA
                  </option>
                  <option className="bg-slate-900" value="USER">
                    USER
                  </option>
                  <option className="bg-slate-900" value="SYSTEM">
                    SYSTEM
                  </option>
                </select>
              }
            />

            {permissions.canUseRoleFilter && (
              <FilterCard
                label="Role"
                content={
                  <select
                    value={filters.role}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        role: e.target.value,
                        page: 1,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option className="bg-slate-900" value="">
                      Semua Role
                    </option>
                    <option className="bg-slate-900" value="developer">
                      developer
                    </option>
                    <option className="bg-slate-900" value="owner">
                      owner
                    </option>
                    <option className="bg-slate-900" value="staff">
                      staff
                    </option>
                  </select>
                }
              />
            )}

            <FilterCard
              label="Live Update"
              content={
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-sm text-slate-300">
                    {liveUpdate ? "Aktif" : "Nonaktif"}
                  </span>
                  <button
                    onClick={() => setLiveUpdate((prev) => !prev)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      liveUpdate
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {liveUpdate ? "ON" : "OFF"}
                  </button>
                </div>
              }
            />
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
            {permissions.canUseRoleFilter && (
              <>
                <button
                  onClick={handleClearOld}
                  className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700"
                >
                  Clear &gt;30 Hari
                </button>

                <button
                  onClick={handleClearAll}
                  className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
                >
                  Hapus Semua
                </button>
              </>
            )}

            <button
              onClick={() => fetchLogs(true)}
              className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              Refresh Manual
            </button>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
              <div>
                <h2 className="text-lg font-semibold">Riwayat Aktivitas</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Total: {meta.total} data audit
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-300">
                Halaman {meta.page} / {meta.totalPages || 1}
              </div>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="block space-y-3 p-4 md:hidden">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-10 text-center text-sm text-slate-400">
                  Memuat audit log...
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                  Tidak ada data audit log.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Waktu</p>
                        <p className="mt-1 text-sm font-medium text-slate-200">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action || "-"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4">
                      <MobileInfo label="User" value={log.username || "-"} />
                      <MobileInfo label="Role" value={log.role || "-"} capitalize />
                      <MobileInfo label="Entity" value={log.entity || "-"} />
                      <MobileInfo
                        label="IP"
                        value={log.ipAddress || log.ip || "-"}
                      />
                    </div>

                    <div className="mt-4">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Deskripsi
                      </p>
                      <p className="mt-1 line-clamp-3 break-words text-sm text-slate-300">
                        {log.description || "-"}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setOpenModal(true);
                        }}
                        className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-medium text-white hover:bg-slate-600"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-4 text-left text-slate-300">Waktu</th>
                    <th className="px-4 py-4 text-left text-slate-300">User</th>
                    <th className="px-4 py-4 text-left text-slate-300">Role</th>
                    <th className="px-4 py-4 text-left text-slate-300">
                      Action
                    </th>
                    <th className="px-4 py-4 text-left text-slate-300">
                      Entity
                    </th>
                    <th className="px-4 py-4 text-left text-slate-300">
                      Detail
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-10 text-slate-400" colSpan={6}>
                        Memuat audit log...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-slate-400" colSpan={6}>
                        Tidak ada data audit log
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-t border-white/10 hover:bg-white/[0.04]"
                      >
                        <td className="whitespace-nowrap px-4 py-4">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-4">{log.username || "-"}</td>
                        <td className="px-4 py-4 capitalize">
                          {log.role || "-"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4">{log.entity || "-"}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setOpenModal(true);
                            }}
                            className="rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600"
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-400">
                Total: {meta.total} data
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <button
                  disabled={meta.page <= 1}
                  onClick={goPrev}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Prev
                </button>

                <span className="hidden text-sm text-slate-300 sm:inline">
                  Halaman {meta.page} / {meta.totalPages || 1}
                </span>

                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={goNext}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AuditDetailModal
        open={openModal}
        data={selectedLog}
        onClose={() => setOpenModal(false)}
      />
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