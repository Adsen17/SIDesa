"use client";

import Sidebar from "../components/Sidebar";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [dataKK, setDataKK] = useState([]);
  const [user, setUser] = useState(null);
  const [clock, setClock] = useState("");

  useEffect(() => {
    fetch("/api/warga")
      .then((res) => res.json())
      .then((result) => {
        setData(Array.isArray(result) ? result : []);
      })
      .catch(() => setData([]));
  }, []);

  useEffect(() => {
    fetch("/api/kartu-keluarga")
      .then((res) => res.json())
      .then((result) => {
        setDataKK(Array.isArray(result) ? result : []);
      })
      .catch(() => setDataKK([]));
  }, []);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((result) => setUser(result))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(
        now.toLocaleString("id-ID", {
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const normalize = (v) => String(v || "").toLowerCase().trim();

  const stats = useMemo(() => {
    const total = data.length;

    const laki = data.filter((d) =>
      normalize(d.gender).includes("laki")
    ).length;

    const perempuan = data.filter((d) =>
      normalize(d.gender).includes("perempuan")
    ).length;

    const rtMap = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    };

    const statusMap = { Hidup: 0, Meninggal: 0 };
    const hubunganMap = {};

    data.forEach((d) => {
      const rt = String(d.rt || "").trim();

      if (rtMap[rt] !== undefined) rtMap[rt]++;

      const status = d.status || "Hidup";
      const hubungan = d.hubunganKeluarga ? d.hubunganKeluarga.replace(/_/g, " ") : "Belum Diatur";

      if (status === "Hidup") statusMap.Hidup++;
      else if (status === "Meninggal") statusMap.Meninggal++;
      else statusMap.Hidup++; // fallback

      hubunganMap[hubungan] = (hubunganMap[hubungan] || 0) + 1;
    });

    return {
      total,
      laki,
      perempuan,
      totalKK: dataKK.length,
      totalRT: Object.keys(rtMap).length,
      rtChart: Object.keys(rtMap).map((rt) => ({
        name: `RT ${rt}`,
        total: rtMap[rt],
      })),
      rtMap,
      statusChart: [
        { name: "Hidup", value: statusMap.Hidup },
        { name: "Meninggal", value: statusMap.Meninggal },
      ],
      hubunganChart: Object.keys(hubunganMap)
        .map((k) => ({ name: k, total: hubunganMap[k] }))
        .sort((a, b) => b.total - a.total),
    };
  }, [data, dataKK]);

  const COLORS_STATUS = ["#10b981", "#ef4444"];

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
          {/* TOPBAR */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur md:p-5"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl md:h-12 md:w-12">
                  📊
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 md:text-xs">
                    Dashboard
                  </p>
                  <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
                    Selamat datang{user?.username ? `, ${user.username}` : ""}
                  </h1>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 md:text-sm">
                  <span className="shrink-0">🕒</span>
                  <span className="line-clamp-2 break-words">
                    {clock || "Memuat waktu..."}
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-600/20 to-violet-600/20 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-bold uppercase">
                    {user?.username?.[0] || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {user?.username || "Administrator"}
                    </p>
                    <p className="text-xs capitalize text-slate-400">
                      {user?.role || "user"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* HERO */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-fuchsia-600/20 p-5 shadow-xl backdrop-blur md:p-6"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-blue-300">
                  Ringkasan Sistem
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                  Dashboard Data Warga Desa
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Pantau statistik utama, status penduduk, hubungan keluarga, dan
                  persebaran warga per RT dalam satu tampilan modern.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:w-[340px]">
                <MiniInfo
                  title="Data Aktif"
                  value={stats.total}
                  subtitle="Total warga"
                />
                <MiniInfo
                  title="RT Terdata"
                  value={stats.totalRT}
                  subtitle="Wilayah aktif"
                />
              </div>
            </div>
          </motion.section>

          {/* MAIN CARDS */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
          >
            <StatCard
              title="Total Warga"
              value={stats.total}
              subtitle="Data aktif tersimpan"
              gradient="from-blue-500 to-cyan-400"
            />
            <StatCard
              title="Total KK"
              value={stats.totalKK}
              subtitle="Kartu Keluarga terdaftar"
              gradient="from-amber-500 to-orange-400"
            />
            <StatCard
              title="Laki-laki"
              value={stats.laki}
              subtitle="Warga pria"
              gradient="from-emerald-500 to-lime-400"
            />
            <StatCard
              title="Perempuan"
              value={stats.perempuan}
              subtitle="Warga wanita"
              gradient="from-fuchsia-500 to-pink-400"
            />
            <StatCard
              title="Total RT"
              value={stats.totalRT}
              subtitle="Wilayah terdata"
              gradient="from-violet-500 to-purple-400"
            />
          </motion.section>

          {/* RT CARDS */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4"
          >
            {Object.keys(stats.rtMap).map((rt) => (
              <div
                key={rt}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.07] md:p-5"
              >
                <p className="text-sm text-slate-400">RT {rt}</p>
                <h3 className="mt-2 text-3xl font-bold md:text-4xl">
                  {stats.rtMap[rt]}
                </h3>
                <p className="mt-1 text-xs text-slate-500">warga terdaftar</p>
              </div>
            ))}
          </motion.section>

          {/* CHARTS */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6"
          >
            <ChartCard
              title="Status Penduduk"
              subtitle="Perbandingan warga hidup dan meninggal"
            >
              <div className="h-[260px] sm:h-[300px] md:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusChart}
                      dataKey="value"
                      outerRadius="72%"
                      innerRadius="40%"
                      paddingAngle={4}
                    >
                      {COLORS_STATUS.map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Hubungan Keluarga"
              subtitle="Jumlah warga berdasarkan perannya dalam KK"
            >
              <div className="h-[260px] sm:h-[300px] md:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hubunganChart}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-30} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="total"
                      fill="#8b5cf6"
                      radius={[12, 12, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </motion.section>

          {/* CHART: Distribusi RT */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-1 gap-5 xl:gap-6"
          >
            <ChartCard
              title="Distribusi Warga per RT"
              subtitle="Perbandingan jumlah warga di setiap RT"
            >
              <div className="h-[280px] sm:h-[320px] md:h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.rtChart}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="total"
                      fill="#10b981"
                      radius={[12, 12, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, gradient }) {
  return (
    <div
      className={`rounded-3xl bg-gradient-to-r ${gradient} p-5 text-white shadow-xl md:p-6`}
    >
      <p className="text-sm font-medium text-white/85">{title}</p>
      <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
        {value}
      </h2>
      <p className="mt-2 text-sm text-white/80">{subtitle}</p>
    </div>
  );
}

function MiniInfo({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 md:text-xs">
        {title}
      </p>
      <h3 className="mt-1 text-xl font-bold md:text-2xl">{value}</h3>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur md:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold md:text-xl">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}