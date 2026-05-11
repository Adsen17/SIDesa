"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#081225] px-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        {/* Glow effect */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 text-[120px] font-black leading-none tracking-tighter text-transparent"
          style={{
            backgroundImage: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          404
        </motion.div>

        {/* Icon */}
        <div className="mb-4 text-5xl">🗺️</div>

        {/* Text */}
        <h1 className="mb-3 text-2xl font-bold md:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-400">
          Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
          <br />
          Silakan kembali ke halaman yang tersedia.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.back()}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
          >
            ← Kembali
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard")}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold shadow-lg transition hover:opacity-90"
          >
            🏠 Ke Dashboard
          </motion.button>
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-slate-500">
          SI KKN — Sistem Informasi Data Warga Desa
        </div>
      </motion.div>
    </div>
  );
}
