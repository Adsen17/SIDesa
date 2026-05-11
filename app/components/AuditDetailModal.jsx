"use client";

export default function AuditDetailModal({
  open,
  data,
  onClose,
}) {
  if (!open || !data) return null;

  const getColor = (action) => {
    if (action.includes("SUCCESS")) return "text-emerald-400";
    if (action.includes("FAILED")) return "text-red-400";
    if (action.includes("DELETE")) return "text-rose-400";
    return "text-blue-400";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0b1730] text-white shadow-2xl"
      >
        {/* Glow background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.15),_transparent_25%)]" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-blue-300">Audit Log Detail</p>
              <h2 className="text-xl font-bold mt-1">
                Aktivitas Sistem
              </h2>
            </div>

            <button
              onClick={onClose}
              className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">

            <Item label="User" value={data.username || "-"} />
            <Item label="Role" value={data.role || "-"} />

            <Item label="Action" value={
              <span className={getColor(data.action)}>
                {data.action}
              </span>
            } />

            <Item label="Entity" value={data.entity} />

            <Item label="IP Address" value={data.ipAddress} />

            <Item label="Waktu" value={
              new Date(data.createdAt).toLocaleString("id-ID")
            } />

          </div>

          {/* Description */}
          <div className="mt-6">
            <p className="text-xs text-slate-400 uppercase mb-2">
              Deskripsi
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm">
              {data.description || "-"}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}