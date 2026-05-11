"use client";

export default function TopbarMetaCard({
  label = "Label",
  value = "-",
  capitalize = false,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm shadow-md backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 font-semibold text-white ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  );
}