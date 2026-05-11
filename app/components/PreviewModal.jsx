"use client";

export default function PreviewModal({
  open = false,
  title = "Preview Data",
  subtitle = "Periksa kembali data sebelum melanjutkan.",
  items = [],
  confirmText = "Simpan",
  cancelText = "Batal",
  onConfirm,
  onClose,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm fade-in" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl scale-in overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1730] text-white shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.14),_transparent_22%)]" />

        <div className="relative p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-300">Konfirmasi Data</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
            </div>

            <button
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {item.value || "-"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              type="button"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              type="button"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Memproses..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}